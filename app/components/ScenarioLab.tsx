'use client'

import {useEffect, useState} from 'react'

type Kind = 'talent_release' | 'music_license' | 'photo_agreement'

type Terms = {
  allowedTerritories: string[]
  allowedChannels: string[]
  paidAdvertisingAllowed: boolean
  validFrom: string
  validTo: string
  sourceClause: string
}

type ScenarioRightForm = {
  title: string
  kind: Kind
  current: Terms
  proposed: Terms
}

type ScenarioForm = {
  title: string
  assetTitle: string
  usage: {
    territory: string
    channel: string
    isPaid: boolean
    startDate: string
    endDate: string
  }
  rights: ScenarioRightForm[]
}

type ScenarioRecord = {
  id: string
  title: string
  territory: string
  channel: string
  isPaid: boolean
  startDate: string
  endDate: string
  asset: {
    id: string
    title: string
    rights: Array<{
      id: string
      title: string
      kind: string
      allowedTerritories?: string[]
      allowedChannels?: string[]
      paidAdvertisingAllowed?: boolean
      validFrom?: string
      validTo?: string
      sourceClause?: string
    }>
  }
}

const defaultTerms = (): Terms => ({
  allowedTerritories: ['CA'],
  allowedChannels: ['instagram_reels'],
  paidAdvertisingAllowed: true,
  validFrom: '2026-01-01',
  validTo: '2026-12-31',
  sourceClause: 'Usage permitted under the stated territory, channel, paid-media, and validity constraints.',
})

const defaultRight = (): ScenarioRightForm => ({
  title: 'Custom rights document',
  kind: 'talent_release',
  current: defaultTerms(),
  proposed: defaultTerms(),
})

const defaultForm = (): ScenarioForm => ({
  title: 'My live clearance scenario',
  assetTitle: 'My campaign asset',
  usage: {
    territory: 'CA',
    channel: 'instagram_reels',
    isPaid: true,
    startDate: '2026-10-15',
    endDate: '2026-11-30',
  },
  rights: [defaultRight()],
})

function parseList(value: string) {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
}

function joinList(value?: string[]) {
  return (value || []).join(', ')
}

async function jsonRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'Request failed')
  return payload
}

function TermsEditor({
  legend,
  value,
  onChange,
}: {
  legend: string
  value: Terms
  onChange: (next: Terms) => void
}) {
  const [territoriesText, setTerritoriesText] = useState(joinList(value.allowedTerritories))
  const [channelsText, setChannelsText] = useState(joinList(value.allowedChannels))

  useEffect(() => {
    setTerritoriesText(joinList(value.allowedTerritories))
    setChannelsText(joinList(value.allowedChannels))
  }, [value.allowedTerritories, value.allowedChannels])

  return (
    <fieldset className="termsEditor">
      <legend>{legend}</legend>

      <label>
        <span>Territories</span>
        <input
          value={territoriesText}
          onChange={(event) => setTerritoriesText(event.target.value)}
          onBlur={() =>
            onChange({...value, allowedTerritories: parseList(territoriesText)})
          }
          placeholder="CA, US"
        />
      </label>

      <label>
        <span>Channels</span>
        <input
          value={channelsText}
          onChange={(event) => setChannelsText(event.target.value)}
          onBlur={() =>
            onChange({...value, allowedChannels: parseList(channelsText)})
          }
          placeholder="instagram_reels, organic_social"
        />
      </label>

      <label className="scenarioCheckbox">
        <input
          type="checkbox"
          checked={value.paidAdvertisingAllowed}
          onChange={(event) =>
            onChange({...value, paidAdvertisingAllowed: event.target.checked})
          }
        />
        <span>Paid advertising allowed</span>
      </label>

      <div className="scenarioDateGrid">
        <label>
          <span>Valid from</span>
          <input
            type="date"
            value={value.validFrom}
            onChange={(event) => onChange({...value, validFrom: event.target.value})}
          />
        </label>
        <label>
          <span>Valid to</span>
          <input
            type="date"
            value={value.validTo}
            onChange={(event) => onChange({...value, validTo: event.target.value})}
          />
        </label>
      </div>

      <label>
        <span>Source clause / evidence</span>
        <textarea
          rows={4}
          value={value.sourceClause}
          onChange={(event) => onChange({...value, sourceClause: event.target.value})}
        />
      </label>
    </fieldset>
  )
}

export default function ScenarioLab({
  onOpenUsage,
  liveRefreshCount,
}: {
  onOpenUsage: (usageRequestId: string) => void
  liveRefreshCount: number
}) {
  const [form, setForm] = useState<ScenarioForm>(() => defaultForm())
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([])
  const [expanded, setExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editScenario, setEditScenario] = useState<ScenarioRecord | null>(null)
  const [busy, setBusy] = useState<'list' | 'create' | 'save' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function load() {
    setBusy((current) => current || 'list')
    try {
      const payload = await jsonRequest('/api/scenarios')
      setScenarios(payload.scenarios || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scenario list failed')
    } finally {
      setBusy((current) => current === 'list' ? null : current)
    }
  }

  useEffect(() => {
    load()
  }, [liveRefreshCount])

  async function createScenario() {
    setBusy('create')
    setError(null)
    setNotice(null)
    try {
      const payload = await jsonRequest('/api/scenarios', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setNotice(`Created ${payload.scenario.title} as live Sanity content.`)
      setForm(defaultForm())
      setExpanded(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scenario creation failed')
    } finally {
      setBusy(null)
    }
  }

  function updateRight(index: number, next: ScenarioRightForm) {
    setForm((current) => ({
      ...current,
      rights: current.rights.map((right, rightIndex) =>
        rightIndex === index ? next : right,
      ),
    }))
  }

  function addRight() {
    setForm((current) => ({
      ...current,
      rights: [...current.rights, defaultRight()],
    }))
  }

  function removeRight(index: number) {
    setForm((current) => ({
      ...current,
      rights: current.rights.filter((_, rightIndex) => rightIndex !== index),
    }))
  }

  function startEditing(scenario: ScenarioRecord) {
    setEditingId(scenario.id)
    setEditScenario(structuredClone(scenario))
    setError(null)
    setNotice(null)
  }

  async function saveEdit() {
    if (!editScenario) return
    setBusy('save')
    setError(null)
    setNotice(null)

    try {
      await jsonRequest(`/api/scenarios/${encodeURIComponent(editScenario.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          usage: {
            territory: editScenario.territory,
            channel: editScenario.channel,
            isPaid: editScenario.isPaid,
            startDate: editScenario.startDate,
            endDate: editScenario.endDate,
          },
        }),
      })

      for (const right of editScenario.asset.rights) {
        await jsonRequest(`/api/scenarios/${encodeURIComponent(editScenario.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({
            rightId: right.id,
            proposed: {
              allowedTerritories: right.allowedTerritories || [],
              allowedChannels: right.allowedChannels || [],
              paidAdvertisingAllowed: Boolean(right.paidAdvertisingAllowed),
              validFrom: right.validFrom,
              validTo: right.validTo,
              sourceClause: right.sourceClause,
            },
          }),
        })
      }

      setNotice('Saved to Sanity. Live Content API will invalidate the product automatically.')
      setEditingId(null)
      setEditScenario(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scenario update failed')
    } finally {
      setBusy(null)
    }
  }

  async function deleteScenario(scenario: ScenarioRecord) {
    if (!window.confirm(`Delete user scenario "${scenario.title}" and its generated rights, asset, usage, and proofs?`)) return

    setBusy('delete')
    setError(null)
    setNotice(null)
    try {
      await jsonRequest(`/api/scenarios/${encodeURIComponent(scenario.id)}`, {
        method: 'DELETE',
        body: JSON.stringify({approved: true}),
      })
      if (editingId === scenario.id) {
        setEditingId(null)
        setEditScenario(null)
      }
      setNotice('User scenario deleted from Sanity.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scenario deletion failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="scenarioLab">
      <div className="scenarioLabHeader">
        <div>
          <p className="cardKicker">Scenario Lab</p>
          <h2>Bring your own rights case.</h2>
          <p className="muted">
            Create real Sanity rights, assets, and usage requests. Test proposed rights changes live through the same Context MCP, Live Content API, deterministic compiler, evidence, and proof system.
          </p>
        </div>
        <button className="primaryButton" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Close builder' : 'Create live scenario'}
        </button>
      </div>

      <div className="scenarioTruthRail">
        <span>NOT LOCAL MOCK DATA</span>
        <span>REAL CONTENT LAKE DOCUMENTS</span>
        <span>PROPOSED RIGHTS = SANITY DRAFTS</span>
        <span>AUTO-REFRESHED LIVE</span>
      </div>

      {notice && <div className="scenarioNotice">{notice}</div>}
      {error && <div className="errorBanner" role="alert">{error}</div>}

      {expanded && (
        <article className="panel scenarioBuilder">
          <div className="panelHeading">
            <span className="stepIndex">+</span>
            <div>
              <p className="cardKicker">New live scenario</p>
              <h3>Define current rights, proposed rights, and intended usage</h3>
            </div>
          </div>

          <div className="scenarioBasics">
            <label>
              <span>Scenario / usage title</span>
              <input
                value={form.title}
                onChange={(event) => setForm({...form, title: event.target.value})}
              />
            </label>
            <label>
              <span>Asset title</span>
              <input
                value={form.assetTitle}
                onChange={(event) => setForm({...form, assetTitle: event.target.value})}
              />
            </label>
          </div>

          <div className="scenarioUsage">
            <h4>Usage to test</h4>
            <div className="scenarioFieldGrid">
              <label>
                <span>Territory</span>
                <input
                  value={form.usage.territory}
                  onChange={(event) =>
                    setForm({...form, usage: {...form.usage, territory: event.target.value}})
                  }
                />
              </label>
              <label>
                <span>Channel</span>
                <input
                  value={form.usage.channel}
                  onChange={(event) =>
                    setForm({...form, usage: {...form.usage, channel: event.target.value}})
                  }
                />
              </label>
              <label>
                <span>Start date</span>
                <input
                  type="date"
                  value={form.usage.startDate}
                  onChange={(event) =>
                    setForm({...form, usage: {...form.usage, startDate: event.target.value}})
                  }
                />
              </label>
              <label>
                <span>End date</span>
                <input
                  type="date"
                  value={form.usage.endDate}
                  onChange={(event) =>
                    setForm({...form, usage: {...form.usage, endDate: event.target.value}})
                  }
                />
              </label>
            </div>
            <label className="scenarioCheckbox">
              <input
                type="checkbox"
                checked={form.usage.isPaid}
                onChange={(event) =>
                  setForm({...form, usage: {...form.usage, isPaid: event.target.checked}})
                }
              />
              <span>This usage requests paid media</span>
            </label>
          </div>

          <div className="scenarioRightsStack">
            {form.rights.map((right, index) => (
              <section className="scenarioRightBuilder" key={index}>
                <div className="scenarioRightHeader">
                  <div>
                    <span>Governing right {index + 1}</span>
                    <strong>{right.title}</strong>
                  </div>
                  {form.rights.length > 1 && (
                    <button className="textButton" onClick={() => removeRight(index)}>
                      Remove
                    </button>
                  )}
                </div>

                <div className="scenarioFieldGrid">
                  <label>
                    <span>Rights title</span>
                    <input
                      value={right.title}
                      onChange={(event) =>
                        updateRight(index, {...right, title: event.target.value})
                      }
                    />
                  </label>
                  <label>
                    <span>Kind</span>
                    <select
                      value={right.kind}
                      onChange={(event) =>
                        updateRight(index, {...right, kind: event.target.value as Kind})
                      }
                    >
                      <option value="talent_release">Talent release</option>
                      <option value="music_license">Music license</option>
                      <option value="photo_agreement">Photographer agreement</option>
                    </select>
                  </label>
                </div>

                <div className="termsSplit">
                  <TermsEditor
                    legend="Current / published terms"
                    value={right.current}
                    onChange={(current) => updateRight(index, {...right, current})}
                  />
                  <div className="proposedTerms">
                    <button
                      className="secondaryButton"
                      onClick={() =>
                        updateRight(index, {
                          ...right,
                          proposed: structuredClone(right.current),
                        })
                      }
                    >
                      Copy current → proposed
                    </button>
                    <TermsEditor
                      legend="Proposed / draft terms"
                      value={right.proposed}
                      onChange={(proposed) => updateRight(index, {...right, proposed})}
                    />
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="scenarioBuilderActions">
            <button className="secondaryButton" onClick={addRight}>
              + Add governing right
            </button>
            <button className="primaryButton" onClick={createScenario} disabled={busy !== null}>
              {busy === 'create' ? 'Creating live content…' : 'Create and test live'}
            </button>
          </div>
        </article>
      )}

      <div className="scenarioLibrary">
        <div className="sectionHeading">
          <div>
            <p className="cardKicker">Your live scenarios</p>
            <h3>{scenarios.length} user-created case{scenarios.length === 1 ? '' : 's'}</h3>
          </div>
          <button className="secondaryButton" onClick={load} disabled={busy !== null}>
            Refresh scenarios
          </button>
        </div>

        {scenarios.length === 0 ? (
          <div className="scenarioEmpty">
            <strong>No user-created scenarios yet.</strong>
            <span>Create one above; it will immediately become part of the live rights graph.</span>
          </div>
        ) : (
          <div className="scenarioCards">
            {scenarios.map((scenario) => (
              <article className="scenarioCard" key={scenario.id}>
                <div className="scenarioCardTop">
                  <div>
                    <span className="changeKind">User scenario</span>
                    <h4>{scenario.title}</h4>
                    <code>{scenario.id}</code>
                  </div>
                  <span className="authorityBadge">LIVE SANITY</span>
                </div>

                <div className="scenarioCardMeta">
                  <span>{scenario.asset.title}</span>
                  <span>{scenario.territory}</span>
                  <span>{scenario.channel.replaceAll('_', ' ')}</span>
                  <span>{scenario.isPaid ? 'paid' : 'organic'}</span>
                  <span>{scenario.asset.rights.length} governing right{scenario.asset.rights.length === 1 ? '' : 's'}</span>
                </div>

                <div className="scenarioCardActions">
                  <button className="primaryButton" onClick={() => onOpenUsage(scenario.id)}>
                    Open in clearance engine
                  </button>
                  <button className="secondaryButton" onClick={() => startEditing(scenario)}>
                    Edit live test
                  </button>
                  <button className="textButton" onClick={() => deleteScenario(scenario)}>
                    Delete
                  </button>
                </div>

                {editingId === scenario.id && editScenario && (
                  <div className="scenarioLiveEditor">
                    <h5>Edit usage intent</h5>
                    <div className="scenarioFieldGrid">
                      <label>
                        <span>Territory</span>
                        <input
                          value={editScenario.territory}
                          onChange={(event) =>
                            setEditScenario({...editScenario, territory: event.target.value})
                          }
                        />
                      </label>
                      <label>
                        <span>Channel</span>
                        <input
                          value={editScenario.channel}
                          onChange={(event) =>
                            setEditScenario({...editScenario, channel: event.target.value})
                          }
                        />
                      </label>
                      <label>
                        <span>Start date</span>
                        <input
                          type="date"
                          value={editScenario.startDate}
                          onChange={(event) =>
                            setEditScenario({...editScenario, startDate: event.target.value})
                          }
                        />
                      </label>
                      <label>
                        <span>End date</span>
                        <input
                          type="date"
                          value={editScenario.endDate}
                          onChange={(event) =>
                            setEditScenario({...editScenario, endDate: event.target.value})
                          }
                        />
                      </label>
                    </div>

                    <label className="scenarioCheckbox">
                      <input
                        type="checkbox"
                        checked={editScenario.isPaid}
                        onChange={(event) =>
                          setEditScenario({...editScenario, isPaid: event.target.checked})
                        }
                      />
                      <span>Usage requests paid media</span>
                    </label>

                    <h5>Edit proposed rights</h5>
                    {editScenario.asset.rights.map((right, rightIndex) => (
                      <div className="scenarioEditRight" key={right.id}>
                        <div>
                          <strong>{right.title}</strong>
                          <code>{right.id}</code>
                        </div>
                        <div className="scenarioFieldGrid">
                          <label>
                            <span>Territories</span>
                            <input
                              defaultValue={joinList(right.allowedTerritories)}
                              onBlur={(event) => {
                                const rights = [...editScenario.asset.rights]
                                rights[rightIndex] = {
                                  ...right,
                                  allowedTerritories: parseList(event.target.value),
                                }
                                setEditScenario({
                                  ...editScenario,
                                  asset: {...editScenario.asset, rights},
                                })
                              }}
                            />
                          </label>
                          <label>
                            <span>Channels</span>
                            <input
                              defaultValue={joinList(right.allowedChannels)}
                              onBlur={(event) => {
                                const rights = [...editScenario.asset.rights]
                                rights[rightIndex] = {
                                  ...right,
                                  allowedChannels: parseList(event.target.value),
                                }
                                setEditScenario({
                                  ...editScenario,
                                  asset: {...editScenario.asset, rights},
                                })
                              }}
                            />
                          </label>
                          <label>
                            <span>Valid from</span>
                            <input
                              type="date"
                              value={right.validFrom || ''}
                              onChange={(event) => {
                                const rights = [...editScenario.asset.rights]
                                rights[rightIndex] = {...right, validFrom: event.target.value}
                                setEditScenario({
                                  ...editScenario,
                                  asset: {...editScenario.asset, rights},
                                })
                              }}
                            />
                          </label>
                          <label>
                            <span>Valid to</span>
                            <input
                              type="date"
                              value={right.validTo || ''}
                              onChange={(event) => {
                                const rights = [...editScenario.asset.rights]
                                rights[rightIndex] = {...right, validTo: event.target.value}
                                setEditScenario({
                                  ...editScenario,
                                  asset: {...editScenario.asset, rights},
                                })
                              }}
                            />
                          </label>
                        </div>
                        <label className="scenarioCheckbox">
                          <input
                            type="checkbox"
                            checked={Boolean(right.paidAdvertisingAllowed)}
                            onChange={(event) => {
                              const rights = [...editScenario.asset.rights]
                              rights[rightIndex] = {
                                ...right,
                                paidAdvertisingAllowed: event.target.checked,
                              }
                              setEditScenario({
                                ...editScenario,
                                asset: {...editScenario.asset, rights},
                              })
                            }}
                          />
                          <span>Proposed rights allow paid advertising</span>
                        </label>
                        <label>
                          <span>Proposed source clause</span>
                          <textarea
                            rows={3}
                            value={right.sourceClause || ''}
                            onChange={(event) => {
                              const rights = [...editScenario.asset.rights]
                              rights[rightIndex] = {...right, sourceClause: event.target.value}
                              setEditScenario({
                                ...editScenario,
                                asset: {...editScenario.asset, rights},
                              })
                            }}
                          />
                        </label>
                      </div>
                    ))}

                    <div className="scenarioCardActions">
                      <button className="primaryButton" onClick={saveEdit} disabled={busy !== null}>
                        {busy === 'save' ? 'Saving…' : 'Save live changes'}
                      </button>
                      <button
                        className="textButton"
                        onClick={() => {
                          setEditingId(null)
                          setEditScenario(null)
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
