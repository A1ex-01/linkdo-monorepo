import { describe, expect, it } from 'vitest'
import styles from './index.css?raw'

describe('admin Tailwind sources', () => {
  it('scans the shared UI component source', () => {
    expect(styles).toContain('@source "../../../../packages/ui/src";')
  })
})
