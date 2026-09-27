import { describe, expect, test } from 'vitest'
import repairFilterConfig from '../repairFilterConfig.js'

describe('repairFilterConfig', () => {
  const camp = {
    _meta: { self: '/camps/1a2b3c4d' },
    shortTitle: 'test camp',
    periods: () => ({
      _meta: { loading: false },
      items: [
        {
          _meta: { self: '/periods/1a2b3c4d' },
          days: () => ({
            _meta: { loading: false },
            items: [
              {
                _meta: { self: '/days/1a2b3c4d' },
              },
            ],
          }),
        },
      ],
    }),
    categories: () => ({
      _meta: { loading: false },
      items: [
        {
          _meta: { self: '/categories/1a2b3c4d' },
        },
      ],
    }),
    campCollaborations: () => ({
      _meta: { loading: false },
      items: [
        {
          _meta: { self: '/camp_collaborations/1a2b3c4d' },
        },
      ],
    }),
    progressLabels: () => ({
      _meta: { loading: false },
      items: [
        {
          _meta: { self: '/progress_labels/1a2b3c4d' },
        },
      ],
    }),
  }

  const args = [camp]

  const defaultFilter = {
    period: null,
    day: [],
    category: [],
    progressLabel: [],
    responsible: [],
    activityCount: 0,
  }

  test('leaves valid filter as is', () => {
    // given
    const config = {
      period: '/periods/1a2b3c4d',
      day: ['/days/1a2b3c4d'],
      category: ['/categories/1a2b3c4d'],
      progressLabel: ['/progress_labels/1a2b3c4d'],
      responsible: ['/camp_collaborations/1a2b3c4d'],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual({
      period: '/periods/1a2b3c4d',
      day: ['/days/1a2b3c4d'],
      category: ['/categories/1a2b3c4d'],
      progressLabel: ['/progress_labels/1a2b3c4d'],
      responsible: ['/camp_collaborations/1a2b3c4d'],
      activityCount: 0,
    })
  })

  test('adds period if missing', () => {
    // given
    const config = {
      day: [],
      category: [],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual(defaultFilter)
  })

  test('removes invalid period', () => {
    // given
    const config = {
      period: '/periods/00000000',
      day: [],
      category: [],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual(defaultFilter)
  })

  test('ignores invalid period if periods are still loading', () => {
    // given
    const config = {
      period: '/periods/00000000',
      day: [],
      category: [],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, {
      ...camp,
      periods: () => ({
        _meta: { loading: true },
      }),
    })

    // then
    expect(result).toEqual({
      period: '/periods/00000000',
      day: [],
      category: [],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    })
  })

  test('adds responsible filter when missing', () => {
    // given
    const config = {
      period: null,
      day: [],
      category: [],
      progressLabel: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual(defaultFilter)
  })

  test('removes invalid responsible', () => {
    // given
    const config = {
      period: null,
      day: [],
      category: [],
      progressLabel: [],
      responsible: ['/camp_collaborations/00000000'],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual(defaultFilter)
  })

  test('ignores invalid responsible if campCollaborations are still loading', () => {
    // given
    const config = {
      period: null,
      day: [],
      category: [],
      progressLabel: [],
      responsible: ['/camp_collaborations/00000000'],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, {
      ...camp,
      campCollaborations: () => ({
        _meta: { loading: true },
      }),
    })

    // then
    expect(result).toEqual({
      period: null,
      day: [],
      category: [],
      progressLabel: [],
      responsible: ['/camp_collaborations/00000000'],
      activityCount: 0,
    })
  })

  test('adds category filter when missing', () => {
    // given
    const config = {
      period: null,
      day: [],
      responsible: [],
      progressLabel: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual(defaultFilter)
  })

  test('removes invalid category', () => {
    // given
    const config = {
      period: null,
      day: [],
      category: ['/categories/00000000'],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual(defaultFilter)
  })

  test('ignores invalid category when categories are still loading', () => {
    // given
    const config = {
      period: null,
      day: [],
      category: ['/categories/00000000'],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, {
      ...camp,
      categories: () => ({
        _meta: { loading: true },
      }),
    })

    // then
    expect(result).toEqual({
      period: null,
      day: [],
      category: ['/categories/00000000'],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    })
  })

  test('adds day filter when missing', () => {
    // given
    const config = {
      period: null,
      category: [],
      responsible: [],
      progressLabel: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual(defaultFilter)
  })

  test('removes invalid day', () => {
    // given
    const config = {
      period: null,
      day: ['/days/00000000'],
      category: [],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual(defaultFilter)
  })

  test('removes invalid day when days are still loading', () => {
    // given
    const config = {
      period: null,
      day: ['/days/00000000'],
      category: [],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, {
      ...camp,
      periods: () => ({
        _meta: { loading: false },
        items: [
          {
            _meta: { self: '/periods/1a2b3c4d' },
            days: () => ({
              _meta: { loading: true },
            }),
          },
        ],
      }),
    })

    // then
    expect(result).toEqual({
      period: null,
      day: ['/days/00000000'],
      category: [],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    })
  })

  test('removes invalid day when periods are still loading', () => {
    // given
    const config = {
      period: null,
      day: ['/days/00000000'],
      category: [],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, {
      ...camp,
      periods: () => ({
        _meta: { loading: true },
      }),
    })

    // then
    expect(result).toEqual({
      period: null,
      day: ['/days/00000000'],
      category: [],
      progressLabel: [],
      responsible: [],
      activityCount: 0,
    })
  })

  test('adds progressLabel filter when missing', () => {
    // given
    const config = {
      period: null,
      day: [],
      category: [],
      responsible: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual(defaultFilter)
  })

  test('removes invalid progressLabel', () => {
    // given
    const config = {
      period: null,
      day: [],
      category: [],
      progressLabel: ['/progress_labels/00000000'],
      responsible: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual(defaultFilter)
  })

  test('ignores invalid progressLabel when progressLabels are still loading', () => {
    // given
    const config = {
      period: null,
      day: [],
      category: [],
      progressLabel: ['/progress_labels/00000000'],
      responsible: [],
      activityCount: 0,
    }

    // when
    const result = repairFilterConfig(config, {
      ...camp,
      progressLabels: () => ({
        _meta: { loading: true },
      }),
    })

    // then
    expect(result).toEqual({
      period: null,
      day: [],
      category: [],
      progressLabel: ['/progress_labels/00000000'],
      responsible: [],
      activityCount: 0,
    })
  })

  test('adds dummy activityCount if missing', () => {
    // given
    const config = {
      period: null,
      day: [],
      category: [],
      progressLabel: [],
      responsible: [],
    }

    // when
    const result = repairFilterConfig(config, ...args)

    // then
    expect(result).toEqual(defaultFilter)
  })
})
