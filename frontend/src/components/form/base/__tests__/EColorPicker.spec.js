import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { render, setTestLocale, snapshotOf } from '@/test/renderWithVuetify.js'
import user from '@testing-library/user-event'
import EColorPicker from '../EColorPicker.vue'
import { mount as mountComponent } from '@vue/test-utils'
import { ClickOutside } from 'vuetify/directives'
import { setupVuetify } from '/tests/setupVuetify.js'

import { ColorSpace, sRGB } from 'colorjs.io/fn'

ColorSpace.register(sRGB)
setupVuetify()
describe.skip('An EColorPicker', () => {
  const COLOR1 = '#FF0000'
  const COLOR2 = '#FF00FF'
  const COLOR3 = '#FAFFAF'
  const INVALID_COLOR = 'some new color'
  const PICKER_BUTTON_LABEL_TEXT = 'Dialog öffnen, um eine Farbe für test zu wählen'
  const VALIDATION_MESSAGE = 'Bitte gültige Farbe eingeben.'

  beforeEach(() => {
    setTestLocale('de')
  })

  it('renders the component', async () => {
    // given

    // when
    render(EColorPicker, {
      props: {
        value: COLOR1,
        label: 'test',
      },
    })

    // then
    await screen.findByDisplayValue(COLOR1)
    screen.getByLabelText(PICKER_BUTTON_LABEL_TEXT)
  })

  it('looks like a color picker', async () => {
    // given

    // when
    const { container } = render(EColorPicker, {
      props: { value: COLOR1, label: 'test' },
    })

    // then
    expect(snapshotOf(container)).toMatchSnapshot('pickerclosed')

    // when
    await user.click(screen.getByLabelText(PICKER_BUTTON_LABEL_TEXT))

    // then
    await screen.findByTestId('colorpicker')
    expect(snapshotOf(container)).toMatchSnapshot('pickeropen')
  })

  it('opens the picker when the text field is clicked', async () => {
    // given
    render(EColorPicker, {
      props: { value: COLOR1, label: 'test' },
    })
    const inputField = await screen.findByDisplayValue(COLOR1)

    // when
    await user.click(inputField)

    // then
    await waitFor(async () => {
      expect(await screen.findByTestId('colorpicker')).toBeVisible()
    })
  })

  it('opens the picker when the icon button is clicked', async () => {
    // given
    render(EColorPicker, {
      props: { value: COLOR1, label: 'test' },
    })
    const button = await screen.getByLabelText(PICKER_BUTTON_LABEL_TEXT)

    // when
    await user.click(button)

    // then
    await waitFor(async () => {
      expect(await screen.findByTestId('colorpicker')).toBeVisible()
    })
  })

  it('closes the picker when clicking outside', async () => {
    // given
    render(EColorPicker, {
      props: { value: COLOR1, label: 'test' },
    })
    const button = await screen.getByLabelText(PICKER_BUTTON_LABEL_TEXT)
    await user.click(button)
    await waitFor(async () => {
      expect(await screen.findByTestId('colorpicker')).toBeVisible()
    })

    // when
    await user.click(document.body)

    // then
    await waitFor(async () => {
      expect(await screen.queryByTestId('colorpicker')).not.toBeVisible()
    })
  })

  it('closes the picker when pressing escape', async () => {
    // given
    render(EColorPicker, {
      props: { value: COLOR1, label: 'test' },
    })
    const button = await screen.getByLabelText(PICKER_BUTTON_LABEL_TEXT)
    await user.click(button)
    await waitFor(async () => {
      expect(await screen.findByTestId('colorpicker')).toBeVisible()
    })

    // when
    await user.keyboard('{Escape}')

    // then
    await waitFor(async () => {
      expect(await screen.queryByTestId('colorpicker')).not.toBeVisible()
    })
  })

  it('does not close the picker when selecting a color', async () => {
    // given
    const { container } = render(EColorPicker, {
      props: { value: COLOR1, label: 'test' },
    })
    const button = await screen.getByLabelText(PICKER_BUTTON_LABEL_TEXT)
    await user.click(button)
    await waitFor(async () => {
      expect(await screen.findByTestId('colorpicker')).toBeVisible()
    })

    // when
    // click inside the color picker canvas to select a different color
    const canvas = container.querySelector('canvas')
    await user.click(canvas, { clientX: 10, clientY: 10 })

    // then
    // close button should stay visible
    await expect(
      waitFor(() => {
        expect(screen.queryByTestId('colorpicker')).not.toBeVisible()
      })
    ).rejects.toThrow(/Received element is visible/)
  })

  it('updates v-model when the value changes', async () => {
    // given
    const { emitted } = render(EColorPicker, {
      props: { value: COLOR1, label: 'test' },
    })
    const inputField = await screen.findByDisplayValue(COLOR1)

    // when
    await user.clear(inputField)
    await user.keyboard(COLOR2)

    // then
    await waitFor(async () => {
      const events = emitted().input
      // some input events were fired
      expect(events.length).toBeGreaterThan(0)
      // the last one included the parsed version of our entered time
      expect(events[events.length - 1]).toEqual([COLOR2])
    })
    // Our entered time should be visible...
    screen.getByDisplayValue(COLOR2)
    // ...and stay visible
    await expect(
      waitFor(() => {
        expect(screen.getByDisplayValue(COLOR2)).not.toBeVisible()
      })
    ).rejects.toThrow(/Received element is visible/)
  })

  it('updates v-model when a new color is selected in the picker', async () => {
    // given
    const { emitted, container } = render(EColorPicker, {
      props: { value: COLOR1, label: 'test' },
    })
    await screen.findByDisplayValue(COLOR1)
    const button = await screen.getByLabelText(PICKER_BUTTON_LABEL_TEXT)

    // when
    // click the button to open the picker
    await user.click(button)
    // click inside the color picker canvas to select a different color
    const canvas = container.querySelector('canvas')
    await user.click(canvas, { clientX: 10, clientY: 10 })
    // click the close button
    await user.click(screen.getByTestId('colorpicker'))

    // then
    await waitFor(async () => {
      const events = emitted().input
      // some input events were fired
      expect(events.length).toBeGreaterThan(0)
      // the last one included the parsed version of our entered time
      expect(events[events.length - 1]).toEqual([COLOR3])
    })
    // Our entered time should be visible...
    screen.getByDisplayValue(COLOR3)
    // ...and stay visible
    await expect(
      waitFor(() => {
        expect(screen.getByDisplayValue(COLOR3)).not.toBeVisible()
      })
    ).rejects.toThrow(/Received element is visible/)
  })

  it('validates the input', async () => {
    // given
    render(EColorPicker, {
      props: { value: COLOR1, path: 'test', validationLabelOverride: 'test' },
    })
    const inputField = await screen.findByDisplayValue(COLOR1)

    // when
    await user.clear(inputField)
    await user.keyboard(INVALID_COLOR)
    await fireEvent.blur(inputField)

    // then
    await screen.findByText(VALIDATION_MESSAGE)
  })

  it('accepts null', async () => {
    render(EColorPicker, {
      props: { value: COLOR2, label: 'test' },
    })
    const inputField = await screen.findByDisplayValue(COLOR2)
    expect(inputField).toHaveValue(COLOR2)
    const button = await screen.getByLabelText(PICKER_BUTTON_LABEL_TEXT)
    // click the button to open the picker
    await user.click(button)

    // when
    await user.click(screen.getByTestId('colorpicker').querySelector('.reset'))
    expect(inputField).toHaveValue('')
  })
})

describe('EColorPicker onPickerFieldInput', () => {
  const mount = () =>
    mountComponent(EColorPicker, {
      props: { modelValue: '#FF0000', label: 'test' },
      global: {
        directives: { 'click-outside': ClickOutside },
        mocks: { $t: (key) => key },
      },
      attachTo: document.body,
    })

  const numberInput = (value, { min = '', max = '' } = {}) => {
    const el = document.createElement('input')
    el.type = 'number'
    el.value = value
    el.min = min
    el.max = max
    return el
  }

  const textInput = (value) => {
    const el = document.createElement('input')
    el.type = 'text'
    el.value = value
    return el
  }

  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    wrapper = mount()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('ignores events from non-INPUT elements', () => {
    // given
    const div = document.createElement('div')

    // when / then (no error thrown)
    wrapper.vm.onPickerFieldInput({ target: div })
  })

  it('clamps number input value above default max of 255', () => {
    // given
    const input = numberInput('300')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })

    // then
    expect(input.value).toBe('255')
  })

  it('clamps number input value below default min of 0', () => {
    // given
    const input = numberInput('-10')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })

    // then
    expect(input.value).toBe('0')
  })

  it('leaves number input value unchanged when within default range', () => {
    // given
    const input = numberInput('128')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })

    // then
    expect(input.value).toBe('128')
  })

  it('respects custom max attribute on number input', () => {
    // given
    const input = numberInput('400', { max: '360' })

    // when
    wrapper.vm.onPickerFieldInput({ target: input })

    // then
    expect(input.value).toBe('360')
  })

  it('respects custom min attribute on number input', () => {
    // given
    const input = numberInput('-5', { min: '10', max: '100' })

    // when
    wrapper.vm.onPickerFieldInput({ target: input })

    // then
    expect(input.value).toBe('10')
  })

  it('always dispatches a change event on number input', () => {
    // given
    const input = numberInput('128')
    const dispatchSpy = vi.spyOn(input, 'dispatchEvent')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })

    // then
    expect(dispatchSpy).toHaveBeenCalledOnce()
    expect(dispatchSpy.mock.calls[0][0].type).toBe('change')
  })

  it('dispatches change event even when number input value is empty/NaN', () => {
    // given
    const input = numberInput('')
    const dispatchSpy = vi.spyOn(input, 'dispatchEvent')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })

    // then
    expect(dispatchSpy).toHaveBeenCalledOnce()
    expect(input.value).toBe('')
  })

  it('updates pickerValue with valid 6-digit hex after debounce', () => {
    // given
    const input = textInput('#1A2B3C')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })
    vi.runAllTimers()

    // then
    expect(wrapper.vm.pickerValue).toBe('#1A2B3C')
  })

  it('normalizes lowercase 6-digit hex to uppercase after debounce', () => {
    // given
    const input = textInput('#abc123')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })
    vi.runAllTimers()

    // then
    expect(wrapper.vm.pickerValue).toBe('#ABC123')
  })

  it('expands 3-digit hex to 6-digit and updates pickerValue after debounce', () => {
    // given
    const input = textInput('#ABC')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })
    vi.runAllTimers()

    // then
    expect(wrapper.vm.pickerValue).toBe('#AABBCC')
  })

  it('expands lowercase 3-digit hex to uppercase 6-digit after debounce', () => {
    // given
    const input = textInput('#a1b')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })
    vi.runAllTimers()

    // then
    expect(wrapper.vm.pickerValue).toBe('#AA11BB')
  })

  it('does not update pickerValue for incomplete hex', () => {
    // given
    const input = textInput('#12345')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })
    vi.runAllTimers()

    // then
    expect(wrapper.vm.pickerValue).toBe('#FF0000')
  })

  it('does not update pickerValue for non-hex text input', () => {
    // given
    const input = textInput('red')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })
    vi.runAllTimers()

    // then
    expect(wrapper.vm.pickerValue).toBe('#FF0000')
  })

  it('does not update pickerValue before debounce timeout', () => {
    // given
    const input = textInput('#AABBCC')

    // when
    wrapper.vm.onPickerFieldInput({ target: input })
    // do NOT advance timers

    // then
    expect(wrapper.vm.pickerValue).toBe('#FF0000')
  })
})
