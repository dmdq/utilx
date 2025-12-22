export const useFavorites = () => {
  const favorites = ref([])

  const loadFavorites = () => {
    const saved = localStorage.getItem('favoriteTools')
    if (saved) {
      favorites.value = JSON.parse(saved)
    }
  }

  const saveFavorites = () => {
    localStorage.setItem('favoriteTools', JSON.stringify(favorites.value))
  }

  const toggleFavorite = (tool) => {
    const index = favorites.value.findIndex(fav => fav.url === tool.url)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push({
        name: tool.name,
        url: tool.url,
        icon: tool.icon,
        description: tool.description,
        addedAt: new Date().toISOString()
      })
    }
    saveFavorites()
  }

  const isFavorite = (toolUrl) => {
    return favorites.value.some(fav => fav.url === toolUrl)
  }

  onMounted(() => {
    loadFavorites()
  })

  return {
    favorites: readonly(favorites),
    toggleFavorite,
    isFavorite,
    loadFavorites
  }
}