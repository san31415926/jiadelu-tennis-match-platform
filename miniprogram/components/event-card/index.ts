Component({
  properties: {
    event: {
      type: Object,
      value: null,
    },
  },

  methods: {
    currentId(): string | undefined {
      const event = this.data.event as { id?: string } | null;
      return event?.id;
    },

    onCardTap() {
      this.triggerEvent('cardtap', { id: this.currentId() });
    },

    onActionTap() {
      this.triggerEvent('actiontap', { id: this.currentId() });
    },
  },
});
