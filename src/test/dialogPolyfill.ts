/**
 * jsdom has no showModal()/close(). This is the minimum the app relies on:
 * toggling `open`, firing `close`, and closing the top dialog on Esc (via a
 * cancelable `cancel` event, like browsers). It doesn't emulate the top layer
 * or inertness — those are the browser's job and aren't under test.
 */
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }

  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    const dialog = Array.from(document.querySelectorAll('dialog[open]')).pop()
    if (!(dialog instanceof HTMLDialogElement)) return
    const cancel = new Event('cancel', { cancelable: true })
    if (dialog.dispatchEvent(cancel)) dialog.close()
  })
}
