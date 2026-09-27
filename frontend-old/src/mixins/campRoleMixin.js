export const campRoleMixin = {
  computed: {
    isContributor() {
      return this.isMember || this.isManager
    },
    isGuest() {
      return this.role === 'guest'
    },
    isManager() {
      return this.role === 'manager'
    },
    isMember() {
      return this.role === 'member'
    },
    isOutsider() {
      return this.camp && typeof this._campCollaborations === 'function' && !this.role
    },
    role() {
      const currentUserLink = this.$store.getters.getLoggedInUser?._meta.self
      const result = this._campCollaborations
        .filter((coll) => typeof coll.user === 'function')
        .find((coll) => coll.user()._meta.self === currentUserLink)

      if (result?._meta.loading) return null
      return result?.role
    },
    _campCollaborations() {
      if (!this.camp) return []
      if (typeof this.camp.campCollaborations !== 'function') {
        return []
      }
      return this._camp?.campCollaborations()?.items
    },
    _camp() {
      if (typeof this.camp === 'function') {
        return this.camp()
      }
      return this.camp
    },
  },
}
