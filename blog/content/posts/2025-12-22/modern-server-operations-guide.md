---
title: "现代服务器运维完全指南：自动化监控与智能运维最佳实践"
slug: "modern-server-operations-guide"
summary: "全面介绍现代服务器运维的核心技术和最佳实践，包括自动化部署、监控告警、性能优化、故障排除和安全加固，帮助运维团队构建高效、可靠的服务器管理体系。"
date: 2025-12-22T14:00:00+08:00
draft: false
tags: ["服务器运维", "DevOps", "监控", "自动化", "系统管理"]
categories: ["DevOps"]
---

现代服务器运维已经从传统的手动操作发展为高度自动化、智能化的管理体系。随着云计算和容器化技术的普及，运维工程师需要掌握更先进的工具和方法论。本文将深入探讨现代服务器运维的各个方面，从基础架构到智能运维实践。

## 自动化运维基础

### 基础设施即代码（IaC）

使用Terraform管理基础设施：

```hcl
# terraform/main.tf
provider "aws" {
  region = var.aws_region
}

# VPC配置
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "main-vpc"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# 公有子网
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
  }
}

# 私有子网
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 101}.0/24"
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "private-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "private"
  }
}

# EC2实例配置
resource "aws_instance" "web_server" {
  count                       = var.instance_count
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.private[count.index % length(aws_subnet.private)].id
  vpc_security_group_ids      = [aws_security_group.web_server.id]
  key_name                    = var.key_name
  associate_public_ip_address = false

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = var.environment
    region      = var.aws_region
  }))

  tags = {
    Name        = "web-server-${count.index + 1}"
    Environment = var.environment
    Role        = "web"
    ManagedBy   = "terraform"
  }
}

# 自动扩展组
resource "aws_autoscaling_group" "web_servers" {
  name                = "web-servers-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.web_servers.arn]
  health_check_type   = "EC2"
  health_check_grace_period = 300

  min_size         = var.min_instances
  max_size         = var.max_instances
  desired_capacity = var.desired_instances

  launch_template {
    id      = aws_launch_template.web_server.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "web-server"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# 监控和告警
resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "web-server-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web_servers.name
  }

  tags = {
    Environment = var.environment
  }
}
```

### 配置管理

使用Ansible进行服务器配置管理：

```yaml
# ansible/playbooks/web_server.yml
---
- name: Configure Web Servers
  hosts: webservers
  become: yes
  vars:
    app_user: appuser
    app_dir: /opt/myapp
    nginx_worker_processes: "{{ ansible_processor_cores }}"
    nginx_worker_connections: 1024

  tasks:
    - name: Update apt packages
      apt:
        update_cache: yes
        upgrade: dist
      when: ansible_os_family == "Debian"

    - name: Update yum packages
      yum:
        name: "*"
        state: latest
      when: ansible_os_family == "RedHat"

    - name: Install required packages
      package:
        name:
          - nginx
          - nodejs
          - npm
          - git
          - htop
          - fail2ban
          - ufw
        state: present

    - name: Create application user
      user:
        name: "{{ app_user }}"
        shell: /bin/bash
        home: "{{ app_dir }}"
        create_home: yes
        system: yes

    - name: Create application directory
      file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ app_user }}"
        group: "{{ app_user }}"
        mode: '0755'

    - name: Configure Nginx
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        owner: root
        group: root
        mode: '0644'
      notify: restart nginx

    - name: Configure Nginx site
      template:
        src: site.conf.j2
        dest: /etc/nginx/sites-available/myapp
        owner: root
        group: root
        mode: '0644'
      notify: restart nginx

    - name: Enable Nginx site
      file:
        src: /etc/nginx/sites-available/myapp
        dest: /etc/nginx/sites-enabled/myapp
        state: link
      notify: restart nginx

    - name: Configure firewall
      ufw:
        rule: allow
        name: "{{ item }}"
      loop:
        - OpenSSH
        - 'Nginx Full'

    - name: Set firewall default policy
      ufw:
        state: enabled
        policy: deny

    - name: Configure fail2ban
      template:
        src: jail.local.j2
        dest: /etc/fail2ban/jail.local
        owner: root
        group: root
        mode: '0644'
      notify: restart fail2ban

    - name: Deploy monitoring script
      template:
        src: monitor.sh.j2
        dest: "{{ app_dir }}/monitor.sh"
        owner: "{{ app_user }}"
        group: "{{ app_user }}"
        mode: '0755'

    - name: Setup monitoring cron job
      cron:
        name: "Application monitoring"
        job: "{{ app_dir }}/monitor.sh"
        user: "{{ app_user }}"
        minute: "*/5"

  handlers:
    - name: restart nginx
      service:
        name: nginx
        state: restarted

    - name: restart fail2ban
      service:
        name: fail2ban
        state: restarted
```

## 监控与告警系统

### Prometheus监控系统

配置全方位的服务器监控：

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # 服务器节点监控
  - job_name: 'node-exporter'
    static_configs:
      - targets:
        - 'server1:9100'
        - 'server2:9100'
        - 'server3:9100'
    scrape_interval: 30s

  # 系统服务监控
  - job_name: 'systemd-exporter'
    static_configs:
      - targets:
        - 'server1:9551'
        - 'server2:9551'
        - 'server3:9551'

  # MySQL数据库监控
  - job_name: 'mysql-exporter'
    static_configs:
      - targets:
        - 'db1:9104'
        - 'db2:9104'

  # Redis监控
  - job_name: 'redis-exporter'
    static_configs:
      - targets:
        - 'redis1:9121'
        - 'redis2:9121'

  # Nginx监控
  - job_name: 'nginx-exporter'
    static_configs:
      - targets:
        - 'server1:9113'
        - 'server2:9113'
        - 'server3:9113'

  # 应用监控
  - job_name: 'application'
    static_configs:
      - targets:
        - 'app1:3000'
        - 'app2:3000'
        - 'app3:3000'
    metrics_path: '/metrics'
    scrape_interval: 10s

# 告警规则
# prometheus/rules/server_alerts.yml
groups:
  - name: server_alerts
    rules:
      # CPU使用率告警
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is above 80% for more than 5 minutes on {{ $labels.instance }}"

      # 内存使用率告警
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is above 90% for more than 5 minutes on {{ $labels.instance }}"

      # 磁盘空间告警
      - alert: DiskSpaceLow
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Disk space low on {{ $labels.instance }}"
          description: "Disk usage is above 85% on {{ $labels.instance }}:{{ $labels.mountpoint }}"

      # 网络连接数告警
      - alert: TooManyConnections
        expr: node_netstat_Tcp_CurrEstab > 10000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Too many TCP connections on {{ $labels.instance }}"
          description: "TCP connections count is {{ $value }} on {{ $labels.instance }}"

      # 系统负载告警
      - alert: HighSystemLoad
        expr: node_load15 > (2 * node_cpu_cores)
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High system load on {{ $labels.instance }}"
          description: "15-minute load average is {{ $value }} on {{ $labels.instance }}"
```

### Grafana仪表板

创建直观的监控仪表板：

```json
{
  "dashboard": {
    "title": "Server Monitoring Dashboard",
    "tags": ["server", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "title": "System Overview",
        "type": "stat",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "targets": [
          {
            "expr": "up{job=\"node-exporter\"}",
            "legendFormat": "{{ instance }}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {"options": {"0": {"text": "DOWN", "color": "red"}}},
              {"options": {"1": {"text": "UP", "color": "green"}}}
            ],
            "thresholds": {
              "steps": [
                {"color": "red", "value": null},
                {"color": "green", "value": 1}
              ]
            }
          }
        }
      },
      {
        "title": "CPU Usage",
        "type": "graph",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "targets": [
          {
            "expr": "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "{{ instance }}"
          }
        ],
        "yAxes": [
          {"max": 100, "min": 0, "unit": "percent"}
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "{{ instance }}"
          }
        ],
        "yAxes": [
          {"max": 100, "min": 0, "unit": "percent"}
        ]
      },
      {
        "title": "Disk Usage",
        "type": "graph",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8},
        "targets": [
          {
            "expr": "(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100",
            "legendFormat": "{{ instance }}:{{ mountpoint }}"
          }
        ],
        "yAxes": [
          {"max": 100, "min": 0, "unit": "percent"}
        ]
      }
    ]
  }
}
```

## 日志管理与分析

### ELK Stack日志收集

配置集中式日志管理系统：

```yaml
# logstash/pipeline/server_logs.conf
input {
  beats {
    port => 5044
  }
}

filter {
  # 解析Nginx访问日志
  if [fields][service] == "nginx" {
    grok {
      match => {
        "message" => "%{NGINXACCESS}"
      }
    }

    date {
      match => [ "timestamp", "dd/MMM/yyyy:HH:mm:ss Z" ]
    }

    geoip {
      source => "client_ip"
      target => "geoip"
    }
  }

  # 解析系统日志
  if [fields][service] == "system" {
    grok {
      match => {
        "message" => "%{SYSLOGBASE}"
      }
    }

    date {
      match => [ "timestamp", "MMM  d HH:mm:ss", "MMM dd HH:mm:ss" ]
    }
  }

  # 解析应用日志
  if [fields][service] == "application" {
    json {
      source => "message"
    }

    if [level] == "error" {
      mutate {
        add_tag => ["error"]
      }
    }
  }

  # 添加地理位置信息
  if [client_ip] {
    geoip {
      source => "client_ip"
      target => "geoip"
    }
  }

  # 添加时间字段
  mutate {
    add_field => { "log_date" => "%{@timestamp}" }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "server-logs-%{+YYYY.MM.dd}"
    template_name => "server-logs"
    template_pattern => "server-logs-*"
  }

  # 错误日志告警
  if "error" in [tags] {
    email {
      to => "admin@example.com"
      subject => "Error Alert: %{[@metadata][beat][name]}"
      body => "Error occurred on %{[host][name]}: %{[message]}"
    }
  }
}
```

### 自定义监控脚本

编写服务器健康检查脚本：

```bash
#!/bin/bash
# scripts/server_health_check.sh

# 配置变量
ALERT_EMAIL="admin@example.com"
SLACK_WEBHOOK="https://hooks.slack.com/services/xxx/yyy/zzz"
LOG_FILE="/var/log/health_check.log"

# 检查函数
check_disk_space() {
    local threshold=85
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ $usage -gt $threshold ]; then
        send_alert "Disk space critical" "Disk usage is ${usage}% on $(hostname)"
        return 1
    fi
    return 0
}

check_memory_usage() {
    local threshold=90
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')

    if [ $usage -gt $threshold ]; then
        send_alert "Memory usage critical" "Memory usage is ${usage}% on $(hostname)"
        return 1
    fi
    return 0
}

check_cpu_load() {
    local threshold=$(nproc)
    local load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')

    if (( $(echo "$load > $threshold" | bc -l) )); then
        send_alert "CPU load critical" "CPU load is $load on $(hostname)"
        return 1
    fi
    return 0
}

check_service_status() {
    local services=("nginx" "mysql" "redis-server" "nodejs")

    for service in "${services[@]}"; do
        if ! systemctl is-active --quiet "$service"; then
            send_alert "Service down" "$service is not running on $(hostname)"
            return 1
        fi
    done
    return 0
}

check_network_connectivity() {
    local hosts=("8.8.8.8" "1.1.1.1" "google.com")

    for host in "${hosts[@]}"; do
        if ! ping -c 1 -W 5 "$host" > /dev/null 2>&1; then
            send_alert "Network issue" "Cannot reach $host from $(hostname)"
            return 1
        fi
    done
    return 0
}

check_database_connection() {
    if ! mysql -e "SELECT 1" > /dev/null 2>&1; then
        send_alert "Database connection failed" "Cannot connect to MySQL on $(hostname)"
        return 1
    fi
    return 0
}

check_ssl_certificates() {
    local domains=("example.com" "api.example.com")
    local warning_days=30

    for domain in "${domains[@]}"; do
        local expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))

        if [ $days_until_expiry -lt $warning_days ]; then
            send_alert "SSL certificate expiring" "$domain SSL certificate expires in $days_until_expiry days"
            return 1
        fi
    done
    return 0
}

# 告警发送函数
send_alert() {
    local subject=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # 记录到日志
    echo "[$timestamp] ALERT: $subject - $message" >> $LOG_FILE

    # 发送邮件告警
    echo "$message" | mail -s "[SERVER ALERT] $subject" $ALERT_EMAIL

    # 发送Slack告警
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 Server Alert\n*Subject:* $subject\n*Message:* $message\n*Host:* $(hostname)\n*Time:* $timestamp\"}" \
        $SLACK_WEBHOOK
}

# 生成健康报告
generate_health_report() {
    local report_file="/tmp/health_report_$(date +%Y%m%d_%H%M%S).txt"

    {
        echo "Server Health Report"
        echo "===================="
        echo "Host: $(hostname)"
        echo "Time: $(date)"
        echo ""

        echo "System Information:"
        echo "------------------"
        echo "OS: $(uname -s -r)"
        echo "Uptime: $(uptime -p)"
        echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
        echo ""

        echo "Resource Usage:"
        echo "---------------"
        echo "Disk Usage:"
        df -h | grep -E '^/dev/'
        echo ""
        echo "Memory Usage:"
        free -h
        echo ""
        echo "CPU Usage:"
        top -bn1 | grep "Cpu(s)" | awk '{print "CPU: " $2}'
        echo ""

        echo "Service Status:"
        echo "---------------"
        systemctl list-units --type=service --state=running | head -10
        echo ""

        echo "Network Connections:"
        echo "-------------------"
        ss -tuln | head -10
        echo ""

        echo "Recent Log Entries:"
        echo "-------------------"
        tail -20 /var/log/syslog | grep -i error
    } > $report_file

    # 发送报告
    mail -s "Health Report for $(hostname)" $ALERT_EMAIL < $report_file

    # 清理临时文件
    rm $report_file
}

# 主函数
main() {
    echo "Starting server health check on $(date)" >> $LOG_FILE

    local failed_checks=0

    # 执行各项检查
    check_disk_space || ((failed_checks++))
    check_memory_usage || ((failed_checks++))
    check_cpu_load || ((failed_checks++))
    check_service_status || ((failed_checks++))
    check_network_connectivity || ((failed_checks++))
    check_database_connection || ((failed_checks++))
    check_ssl_certificates || ((failed_checks++))

    # 如果有检查失败，生成详细报告
    if [ $failed_checks -gt 0 ]; then
        generate_health_report
    fi

    echo "Health check completed. Failed checks: $failed_checks" >> $LOG_FILE
}

# 执行主函数
main "$@"
```

## 性能优化策略

### 系统调优

Linux服务器性能优化配置：

```bash
#!/bin/bash
# scripts/system_optimization.sh

# 网络参数优化
optimize_network() {
    echo "Optimizing network parameters..."

    # TCP参数调优
    cat >> /etc/sysctl.conf << EOF
# Network optimization
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65536
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000
EOF

    # 应用参数
    sysctl -p

    echo "Network optimization completed."
}

# 文件系统优化
optimize_filesystem() {
    echo "Optimizing filesystem..."

    # 调整文件描述符限制
    cat >> /etc/security/limits.conf << EOF
# Increase open files limit
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
EOF

    # 调整内核参数
    cat >> /etc/sysctl.conf << EOF
# Filesystem optimization
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

    sysctl -p

    echo "Filesystem optimization completed."
}

# 数据库优化
optimize_database() {
    echo "Optimizing MySQL configuration..."

    cat >> /etc/mysql/mysql.conf.d/mysqld.cnf << EOF
# MySQL performance optimization
[mysqld]
# Memory settings
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_log_buffer_size = 16M
key_buffer_size = 32M
max_heap_table_size = 64M
tmp_table_size = 64M

# Connection settings
max_connections = 500
max_connect_errors = 10000

# Query cache
query_cache_type = 1
query_cache_size = 64M

# Slow query log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
EOF

    systemctl restart mysql

    echo "Database optimization completed."
}

# 应用服务器优化
optimize_web_server() {
    echo "Optimizing Nginx configuration..."

    cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Caching
    open_file_cache max=10000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

    nginx -t && systemctl reload nginx

    echo "Web server optimization completed."
}

# 执行所有优化
main() {
    echo "Starting system optimization..."

    optimize_network
    optimize_filesystem
    optimize_database
    optimize_web_server

    echo "System optimization completed successfully!"
}

main "$@"
```

## 故障排除与恢复

### 自动化故障诊断

智能故障检测和诊断系统：

```python
#!/usr/bin/env python3
# scripts/fault_diagnosis.py

import os
import subprocess
import re
import json
import time
import psutil
from datetime import datetime
from typing import Dict, List, Tuple

class ServerDiagnostic:
    def __init__(self):
        self.results = {}
        self.thresholds = {
            'cpu_usage': 80.0,
            'memory_usage': 85.0,
            'disk_usage': 90.0,
            'load_average': 2.0,
            'response_time': 5.0
        }

    def diagnose_system(self) -> Dict:
        """执行完整的系统诊断"""
        self.results['timestamp'] = datetime.now().isoformat()
        self.results['hostname'] = os.uname().nodename

        # 基础系统检查
        self.results['cpu'] = self.check_cpu()
        self.results['memory'] = self.check_memory()
        self.results['disk'] = self.check_disk()
        self.results['network'] = self.check_network()
        self.results['processes'] = self.check_processes()
        self.results['services'] = self.check_services()
        self.results['logs'] = self.check_logs()

        # 性能检查
        self.results['performance'] = self.check_performance()

        # 安全检查
        self.results['security'] = self.check_security()

        # 生成诊断报告
        self.results['summary'] = self.generate_summary()

        return self.results

    def check_cpu(self) -> Dict:
        """检查CPU状态"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            load_avg = os.getloadavg()
            cpu_count = psutil.cpu_count()

            cpu_info = {
                'usage_percent': cpu_percent,
                'load_average': {
                    '1min': load_avg[0],
                    '5min': load_avg[1],
                    '15min': load_avg[2]
                },
                'cpu_count': cpu_count,
                'per_cpu_usage': psutil.cpu_percent(percpu=True)
            }

            # 检查是否有问题
            cpu_info['issues'] = []
            if cpu_percent > self.thresholds['cpu_usage']:
                cpu_info['issues'].append(f"High CPU usage: {cpu_percent}%")

            if load_avg[0] > self.thresholds['load_average'] * cpu_count:
                cpu_info['issues'].append(f"High load average: {load_avg[0]}")

            return cpu_info

        except Exception as e:
            return {'error': str(e)}

    def check_memory(self) -> Dict:
        """检查内存状态"""
        try:
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()

            memory_info = {
                'total': memory.total,
                'available': memory.available,
                'used': memory.used,
                'free': memory.free,
                'usage_percent': memory.percent,
                'swap': {
                    'total': swap.total,
                    'used': swap.used,
                    'free': swap.free,
                    'usage_percent': swap.percent
                }
            }

            memory_info['issues'] = []
            if memory.percent > self.thresholds['memory_usage']:
                memory_info['issues'].append(f"High memory usage: {memory.percent}%")

            if swap.percent > 50:
                memory_info['issues'].append(f"High swap usage: {swap.percent}%")

            return memory_info

        except Exception as e:
            return {'error': str(e)}

    def check_disk(self) -> Dict:
        """检查磁盘状态"""
        try:
            disk_partitions = psutil.disk_partitions()
            disk_info = {'partitions': [], 'issues': []}

            for partition in disk_partitions:
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    partition_info = {
                        'device': partition.device,
                        'mountpoint': partition.mountpoint,
                        'fstype': partition.fstype,
                        'total': usage.total,
                        'used': usage.used,
                        'free': usage.free,
                        'usage_percent': (usage.used / usage.total) * 100
                    }

                    if partition_info['usage_percent'] > self.thresholds['disk_usage']:
                        disk_info['issues'].append(
                            f"Low disk space on {partition.mountpoint}: {partition_info['usage_percent']:.1f}%"
                        )

                    disk_info['partitions'].append(partition_info)

                except PermissionError:
                    continue

            return disk_info

        except Exception as e:
            return {'error': str(e)}

    def check_network(self) -> Dict:
        """检查网络状态"""
        try:
            network_info = {
                'interfaces': [],
                'connections': [],
                'issues': []
            }

            # 检查网络接口
            net_io = psutil.net_io_counters(pernic=True)
            for interface, stats in net_io.items():
                interface_info = {
                    'name': interface,
                    'bytes_sent': stats.bytes_sent,
                    'bytes_recv': stats.bytes_recv,
                    'packets_sent': stats.packets_sent,
                    'packets_recv': stats.packets_recv,
                    'errors_in': stats.errin,
                    'errors_out': stats.errout,
                    'drop_in': stats.dropin,
                    'drop_out': stats.dropout
                }
                network_info['interfaces'].append(interface_info)

            # 检查网络连接
            connections = psutil.net_connections()
            connection_stats = {
                'established': 0,
                'listening': 0,
                'time_wait': 0,
                'total': len(connections)
            }

            for conn in connections:
                if conn.status == 'ESTABLISHED':
                    connection_stats['established'] += 1
                elif conn.status == 'LISTEN':
                    connection_stats['listening'] += 1
                elif conn.status == 'TIME_WAIT':
                    connection_stats['time_wait'] += 1

            network_info['connection_stats'] = connection_stats

            # 检查是否有异常
            if connection_stats['time_wait'] > 1000:
                network_info['issues'].append(f"Too many TIME_WAIT connections: {connection_stats['time_wait']}")

            return network_info

        except Exception as e:
            return {'error': str(e)}

    def check_processes(self) -> Dict:
        """检查进程状态"""
        try:
            processes = []
            top_cpu = []
            top_memory = []

            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
                try:
                    proc_info = proc.info
                    processes.append(proc_info)

                    # 记录CPU使用率最高的进程
                    if len(top_cpu) < 10:
                        top_cpu.append(proc_info)
                    else:
                        min_proc = min(top_cpu, key=lambda x: x['cpu_percent'])
                        if proc_info['cpu_percent'] > min_proc['cpu_percent']:
                            top_cpu.remove(min_proc)
                            top_cpu.append(proc_info)

                    # 记录内存使用率最高的进程
                    if len(top_memory) < 10:
                        top_memory.append(proc_info)
                    else:
                        min_proc = min(top_memory, key=lambda x: x['memory_percent'])
                        if proc_info['memory_percent'] > min_proc['memory_percent']:
                            top_memory.remove(min_proc)
                            top_memory.append(proc_info)

                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            return {
                'total_processes': len(processes),
                'top_cpu_processes': sorted(top_cpu, key=lambda x: x['cpu_percent'], reverse=True),
                'top_memory_processes': sorted(top_memory, key=lambda x: x['memory_percent'], reverse=True)
            }

        except Exception as e:
            return {'error': str(e)}

    def check_services(self) -> Dict:
        """检查关键服务状态"""
        critical_services = ['nginx', 'mysql', 'redis-server', 'ssh']
        service_status = {}

        for service in critical_services:
            try:
                # 检查服务是否运行
                result = subprocess.run(
                    ['systemctl', 'is-active', service],
                    capture_output=True, text=True
                )
                service_status[service] = {
                    'status': result.stdout.strip(),
                    'active': result.stdout.strip() == 'active'
                }
            except Exception as e:
                service_status[service] = {
                    'status': 'unknown',
                    'active': False,
                    'error': str(e)
                }

        return service_status

    def check_logs(self) -> Dict:
        """检查系统日志中的错误"""
        log_files = ['/var/log/syslog', '/var/log/auth.log', '/var/log/nginx/error.log']
        log_errors = []

        for log_file in log_files:
            if os.path.exists(log_file):
                try:
                    # 读取最近的错误日志
                    result = subprocess.run(
                        ['tail', '-100', log_file],
                        capture_output=True, text=True
                    )

                    errors = re.findall(r'.*error.*|.*ERROR.*|.*Error.*', result.stdout, re.IGNORECASE)
                    if errors:
                        log_errors.extend([
                            {'file': log_file, 'error': error.strip()}
                            for error in errors[-10:]  # 最近10个错误
                        ])

                except Exception as e:
                    log_errors.append({'file': log_file, 'error': f'Failed to read log: {str(e)}'})

        return {'errors': log_errors}

    def generate_summary(self) -> Dict:
        """生成诊断摘要"""
        issues = []

        # 收集所有问题
        if 'cpu' in self.results and 'issues' in self.results['cpu']:
            issues.extend(self.results['cpu']['issues'])

        if 'memory' in self.results and 'issues' in self.results['memory']:
            issues.extend(self.results['memory']['issues'])

        if 'disk' in self.results and 'issues' in self.results['disk']:
            issues.extend(self.results['disk']['issues'])

        if 'network' in self.results and 'issues' in self.results['network']:
            issues.extend(self.results['network']['issues'])

        # 检查服务状态
        if 'services' in self.results:
            for service, status in self.results['services'].items():
                if not status.get('active', False):
                    issues.append(f"Service {service} is not running")

        return {
            'total_issues': len(issues),
            'issues': issues,
            'health_score': max(0, 100 - len(issues) * 10),
            'recommendations': self.generate_recommendations(issues)
        }

    def generate_recommendations(self, issues: List[str]) -> List[str]:
        """根据问题生成建议"""
        recommendations = []

        for issue in issues:
            if 'CPU' in issue:
                recommendations.append("Consider upgrading CPU or optimizing CPU-intensive processes")
            elif 'memory' in issue.lower():
                recommendations.append("Add more RAM or optimize memory usage")
            elif 'disk' in issue.lower():
                recommendations.append("Clean up disk space or add more storage")
            elif 'service' in issue.lower():
                recommendations.append("Restart failed services or check service configuration")
            elif 'network' in issue.lower():
                recommendations.append("Check network configuration and bandwidth")

        return list(set(recommendations))  # 去重

def main():
    """主函数"""
    diagnostic = ServerDiagnostic()
    results = diagnostic.diagnose_system()

    # 保存诊断结果
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f"/tmp/server_diagnostic_{timestamp}.json"

    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)

    print(f"Diagnostic completed. Results saved to: {output_file}")

    # 如果有问题，发送告警
    if results['summary']['total_issues'] > 0:
        print(f"Found {results['summary']['total_issues']} issues:")
        for issue in results['summary']['issues']:
            print(f"  - {issue}")

if __name__ == '__main__':
    main()
```

## 总结

现代服务器运维是一个综合性的技术领域，需要掌握多种技能和工具：

1. **自动化运维**：使用IaC、配置管理等工具实现基础设施自动化
2. **监控告警**：建立全面的监控体系和智能告警机制
3. **日志管理**：集中化日志收集、分析和存储
4. **性能优化**：系统调优和应用性能优化
5. **故障排除**：快速定位和解决系统问题

通过持续学习和实践这些技能，运维团队可以构建稳定、高效、可扩展的服务器运维体系，为业务的持续发展提供坚实的技术保障。

## 🧰 本章配套工具箱

边读边练：以下工具均在浏览器本地运行，数据不上传，可直接打开使用。

- [Nginx配置生成器](https://www.util.cn/tools/nginx-config-generator/)：按需求生成反向代理负载均衡配置
- [Nginx日志速析](https://www.util.cn/tools/nginx-log-analyzer/)：解析访问日志定位异常流量
- [Crontab生成](https://www.util.cn/tools/crontab-generator/)：可视化生成定时巡检清理任务
- [Linux命令生成](https://www.util.cn/tools/linux-command/)：自然语言查出文中运维命令
- [SSH密钥生成器](https://www.util.cn/tools/ssh-key-generator/)：禁用口令登录后批量换发密钥
- [SSL证书检查](https://www.util.cn/tools/ssl-checker/)：检查证书链有效期防 HTTPS 故障
