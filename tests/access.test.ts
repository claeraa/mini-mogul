import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { MAX_STAGE_VISITORS, VISITOR_SLOT_PX, crowdNote, stageVisitors, visitorsThatFit } from '../src/world/stage.ts'
import { TEXT_SCALE, TEXT_SIZES, defaultSettings, parseSettings } from '../src/worlds/settings.ts'

describe('customers fit the space they are given', () => {
  test('never more than fit, never more than eight, always at least one', () => {
    assert.equal(visitorsThatFit(1000), MAX_STAGE_VISITORS)
    assert.equal(visitorsThatFit(8 * VISITOR_SLOT_PX), 8)
    assert.equal(visitorsThatFit(8 * VISITOR_SLOT_PX - 1), 7)
    assert.equal(visitorsThatFit(5 * VISITOR_SLOT_PX + 20), 5)
    assert.equal(visitorsThatFit(10), 1)
    for (let width = 1; width <= 1400; width += 7) {
      const count = visitorsThatFit(width)
      assert.ok(count >= 1 && count <= MAX_STAGE_VISITORS)
      // They are not squeezed: every customer has a full slot (once there is room for one).
      if (width >= VISITOR_SLOT_PX) assert.ok(count * VISITOR_SLOT_PX <= width, `${count} in ${width}px`)
    }
  })

  test('an unmeasured or impossible width falls back to the usual eight', () => {
    for (const width of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.equal(visitorsThatFit(width), MAX_STAGE_VISITORS)
    }
  })

  test('customers who do not fit are still counted in words', () => {
    // A narrow phone has room for five of 19 customers.
    const room = visitorsThatFit(260)
    assert.equal(room, 5)
    const cast = stageVisitors(19, 15, room)
    assert.equal(cast.length, 5)
    assert.ok(cast.some((v) => v.buys) && cast.some((v) => !v.buys))
    assert.equal(crowdNote('arrived', 19, cast.length)?.text, '+14 more customers')
    assert.equal(crowdNote('expected', 19, cast.length)?.text, '+14 more potential customers')
    // Everyone fits: no note.
    assert.equal(crowdNote('arrived', 4, stageVisitors(4, 4, room).length), null)
  })
})

describe('accessibility preferences', () => {
  test('defaults are safe: normal text, normal contrast, sound off', () => {
    assert.deepEqual(parseSettings(null), defaultSettings)
    assert.equal(defaultSettings.textSize, 'normal')
    assert.equal(defaultSettings.highContrast, false)
    assert.equal(defaultSettings.sound, false)
  })

  test('settings saved before these options existed still load', () => {
    const old = { sound: true, music: false, sfx: true, reduceMotion: true }
    assert.deepEqual(parseSettings(old), { ...old, textSize: 'normal', highContrast: false, guide: 'auto', improveSeen: false })
  })

  test('saved preferences survive a round trip', () => {
    const mine = { sound: false, music: true, sfx: false, reduceMotion: false, textSize: 'larger' as const, highContrast: true, guide: 'done' as const, improveSeen: true }
    assert.deepEqual(parseSettings(JSON.parse(JSON.stringify(mine))), mine)
  })

  test('damaged values fall back one by one', () => {
    const parsed = parseSettings({ sound: 'yes', textSize: 'gigantic', highContrast: 1, reduceMotion: 'no', music: false })
    assert.deepEqual(parsed, { ...defaultSettings, music: false })
    for (const junk of ['text', 42, [], undefined]) assert.deepEqual(parseSettings(junk), defaultSettings)
  })

  test('each text size is larger than the last, up to about a third bigger', () => {
    const scales = TEXT_SIZES.map((size) => TEXT_SCALE[size])
    assert.equal(scales[0], 1)
    for (let i = 1; i < scales.length; i += 1) assert.ok(scales[i] > scales[i - 1])
    assert.ok(scales.at(-1)! >= 1.25 && scales.at(-1)! <= 1.5)
  })
})

describe('styles that must not regress', () => {
  const css = ['src/index.css', 'src/styles/ui.css', 'src/styles/world.css', 'src/styles/play.css']
    .map((file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'))
    .join('\n')

  test('customers are never shrunk to fit', () => {
    assert.doesNotMatch(css, /\.guest[^{]*\{[^}]*\bzoom\s*:/)
  })

  test('the street reflows on the width of the scene, not the screen', () => {
    assert.match(css, /container:\s*world\s*\/\s*inline-size/)
    assert.match(css, /@container world \(max-width: \d+px\)/)
  })

  test('keyboard focus is always visible', () => {
    // One rule covers every control...
    assert.match(css, /(^|\n):focus-visible\s*\{[^}]*outline:\s*3px solid/)
    // ...and the only thing allowed to hide it is a heading, which takes
    // focus for screen readers when a screen changes.
    const hidden = [...css.matchAll(/([^{}]*):focus(?:-visible)?\s*\{[^}]*outline:\s*(?:none|0)\b/g)].map((m) => m[1].trim())
    for (const selector of hidden) assert.match(selector, /h1$/, selector)
  })

  test('reduced motion and high contrast have their own rules', () => {
    const all = css + readFileSync(new URL('../src/styles/scene.css', import.meta.url), 'utf8')
    assert.match(all, /\[data-motion='reduced'\]/)
    assert.match(all, /\[data-contrast='high'\]/)
  })
})
