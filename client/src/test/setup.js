import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

window.scrollTo = vi.fn()
// jsdom has no native modal UI. Real focus trapping is checked in the browser.
HTMLDialogElement.prototype.showModal = function () { this.open = true }
HTMLDialogElement.prototype.close = function () { this.open = false }
afterEach(() => { cleanup(); localStorage.clear() })
