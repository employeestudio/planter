import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  ReactFlow, MiniMap, Controls, Background, BackgroundVariant,
  useNodesState, useEdgesState, Handle, Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'
import { people, PLACES } from './data'

const PANEL_W   = 244   // matches Figma single-panel width
const CONN_W    = 16    // Subtract connector width
const COUPLE_W  = PANEL_W * 2 + CONN_W   // 504
const SINGLE_W  = PANEL_W
const NODE_H    = 97    // matches Figma card height
const HIDDEN    = { background: 'transparent', border: 'none' }

// Subtract connector path from Subtract.svg (fill will be overridden)
const SUBTRACT_D = 'M16 35C16 30.5817 12.4183 27 8 27C3.58172 27 0 30.5817 0 35V0C0 4.41828 3.58172 8 8 8C12.4183 8 16 4.41828 16 0V35Z'

// ── Sub-components ────────────────────────────────────────────────────────────
function PersonPanel({ person, isInLaw }) {
  const isMain  = person?.isMainLine
  const bg      = isMain ? 'rgba(245,158,11,0.10)' : isInLaw ? 'rgba(59,130,246,0.10)' : '#181818'
  const nameClr = isMain ? '#fbbf24' : isInLaw ? '#60a5fa' : '#d4d4d4'
  const birth   = person?.birth?.year  ?? '?'
  const death   = person?.death?.year  ?? '?'
  const bPlace  = person?.birth?.place ?? ''
  const dPlace  = person?.death?.place ?? ''
  return (
    <div
      style={{
        width: PANEL_W,
        height: '100%',
        background: bg,
        padding: 12,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: "'Inter', system-ui, sans-serif",
        flexShrink: 0,
        cursor: 'pointer',
        transition: 'filter 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.25)' }}
      onMouseLeave={e => { e.currentTarget.style.filter = '' }}
    >
      {/* name + lifeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, lineHeight: 1.25,
          color: nameClr,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {person?.name ?? '???'}
        </div>
        <div style={{ fontSize: 13, color: '#555', fontVariantNumeric: 'tabular-nums' }}>
          {birth} – {death}
        </div>
      </div>
      {/* birth / death places */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 12 }}>
        <span style={{ color: '#4ade80', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          {bPlace}
        </span>
        <span style={{ color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, textAlign: 'right' }}>
          {dPlace}
        </span>
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function PersonModal({ person, onClose }) {
  useEffect(() => {
    if (!person) return
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [person, onClose])

  if (!person) return null

  const isMain    = person.isMainLine
  const accentClr = isMain ? '#fbbf24' : '#60a5fa'
  const borderClr = isMain ? '#f59e0b' : '#2a2a2a'
  const birthLbl  = PLACES[person.birth?.place]?.label ?? person.birth?.place ?? '—'
  const deathLbl  = PLACES[person.death?.place]?.label ?? person.death?.place ?? '—'
  const isVet     = person.tags?.includes('vet')

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#111',
          border: `1.5px solid ${borderClr}`,
          borderRadius: 12,
          padding: 28,
          maxWidth: 560,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          fontFamily: "'Inter', system-ui, sans-serif",
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none', border: 'none',
            color: '#555', fontSize: 22, cursor: 'pointer',
            lineHeight: 1, padding: '2px 6px', borderRadius: 4,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#d4d4d4'}
          onMouseLeave={e => e.currentTarget.style.color = '#555'}
        >×</button>

        {/* name */}
        <div style={{ fontSize: 20, fontWeight: 700, color: accentClr, paddingRight: 32, marginBottom: 4 }}>
          {person.name}
        </div>

        {/* meta row */}
        <div style={{ fontSize: 12, color: '#555', marginBottom: 20, display: 'flex', gap: 12 }}>
          <span>Generation {person.generation}</span>
          {isMain && <span style={{ color: '#f59e0b' }}>● Main line</span>}
          {isVet  && <span style={{ color: '#fbbf24', fontWeight: 600 }}>★ Veteran</span>}
        </div>

        {/* life dates grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Born</div>
            <div style={{ fontSize: 15, color: '#4ade80', fontWeight: 600 }}>{person.birth?.year ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#4ade80', opacity: 0.65, marginTop: 2 }}>{birthLbl}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Died</div>
            <div style={{ fontSize: 15, color: '#f87171', fontWeight: 600 }}>{person.death?.year ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#f87171', opacity: 0.65, marginTop: 2 }}>{deathLbl}</div>
          </div>
        </div>

        {/* divider */}
        <div style={{ borderTop: '1px solid #222', marginBottom: 20 }} />

        {/* notes */}
        {person.notes ? (
          <>
            <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Notes</div>
            <div style={{ fontSize: 13, color: '#c4c4c4', lineHeight: 1.7 }}>
              {person.notes}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#3a3a3a', fontStyle: 'italic' }}>No notes recorded for this person.</div>
        )}
      </div>
    </div>
  )
}

// The dogbone connector SVG inlined so fill can be set dynamically.
// rotate-180 mirrors the notch to face leftward, matching the Figma orientation.
function Connector({ fill }) {
  return (
    <svg
      width={CONN_W} height={35}
      viewBox="0 0 16 35"
      fill="none"
      style={{ flexShrink: 0, transform: 'rotate(180deg)', display: 'block', alignSelf: 'center' }}
    >
      <path d={SUBTRACT_D} fill={fill} />
    </svg>
  )
}

// ── Node components ───────────────────────────────────────────────────────────
function CoupleNode({ data }) {
  const { primary, spouse, isInLaw } = data
  const isMain    = primary?.isMainLine || spouse?.isMainLine
  const borderClr = isMain ? '#f59e0b' : isInLaw ? 'rgba(59,130,246,0.35)' : '#2a2a2a'
  const connFill  = isMain ? 'rgba(245,158,11,0.10)' : isInLaw ? 'rgba(59,130,246,0.10)' : '#181818'

  return (
    <>
      <Handle type="target" position={Position.Left}  id="left"  style={HIDDEN} isConnectable={false} />
      <Handle type="source" position={Position.Right} id="right" style={HIDDEN} isConnectable={false} />
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        width: COUPLE_W,
        height: NODE_H,
        border: `1.5px solid ${borderClr}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div data-person-role="primary" style={{ display: 'contents' }}>
          <PersonPanel person={primary} isInLaw={isInLaw} />
        </div>
        <Connector fill={connFill} />
        <div data-person-role="spouse" style={{ display: 'contents' }}>
          <PersonPanel person={spouse} isInLaw={isInLaw} />
        </div>
      </div>
    </>
  )
}

// SingleNode needs its own border+radius since PersonPanel is borderless
function SingleNodeWrapped({ data }) {
  const { person: p, isInLaw } = data
  const isMain = p?.isMainLine
  return (
    <>
      <Handle type="target" position={Position.Left}  id="left"  style={HIDDEN} isConnectable={false} />
      <Handle type="source" position={Position.Right} id="right" style={HIDDEN} isConnectable={false} />
      <div style={{
        width: SINGLE_W,
        height: NODE_H,
        border: `1.5px solid ${isMain ? '#f59e0b' : isInLaw ? 'rgba(59,130,246,0.35)' : '#2a2a2a'}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <PersonPanel person={p} isInLaw={isInLaw} />
      </div>
    </>
  )
}

const nodeTypes = { couple: CoupleNode, single: SingleNodeWrapped }

// ── Main component ────────────────────────────────────────────────────────────
export default function TreeView() {
  const [selectedPerson, setSelectedPerson] = useState(null)

  const { initialNodes, initialEdges } = useMemo(() => {
    // ── Step 1: Collect connected people ─────────────────────
    const connectedIds = new Set()
    people.forEach(p => {
      if (p.parentIds?.length) {
        connectedIds.add(p.id)
        p.parentIds.forEach(pid => connectedIds.add(pid))
      }
    })
    people.forEach(p => {
      if (!p.spouseId) return
      if (connectedIds.has(p.id))       connectedIds.add(p.spouseId)
      if (connectedIds.has(p.spouseId)) connectedIds.add(p.id)
    })

    const connected = people.filter(p => connectedIds.has(p.id))
    const byId = Object.fromEntries(people.map(p => [p.id, p]))

    const primaryIds = new Set()
    connected.forEach(p => p.parentIds?.forEach(pid => primaryIds.add(pid)))

    // ── Step 2: Build all couple pairs ────────────────────────
    const couples    = new Map()    // primaryId → { primary, spouse }
    const pairedIds  = new Set()

    connected.forEach(p => {
      if (pairedIds.has(p.id)) return
      if (!p.spouseId || !connectedIds.has(p.spouseId)) return

      const partner = byId[p.spouseId]
      let primary, spouse

      if      (primaryIds.has(p.id) && !primaryIds.has(partner.id)) { primary = p;       spouse = partner }
      else if (primaryIds.has(partner.id) && !primaryIds.has(p.id)) { primary = partner; spouse = p       }
      else if (p.isMainLine && !partner.isMainLine)                  { primary = p;       spouse = partner }
      else if (partner.isMainLine && !p.isMainLine)                  { primary = partner; spouse = p       }
      else { primary = p.id < partner.id ? p : partner; spouse = primary === p ? partner : p }

      couples.set(primary.id, { primary, spouse })
      pairedIds.add(p.id)
      pairedIds.add(partner.id)
    })

    // ── Step 3: Map each person to their graph node ID ────────
    const graphNodeFor = new Map()
    couples.forEach(({ primary, spouse }) => {
      const gid = `couple-${primary.id}`
      graphNodeFor.set(primary.id, gid)
      graphNodeFor.set(spouse.id, gid)
    })
    connected.forEach(p => { if (!graphNodeFor.has(p.id)) graphNodeFor.set(p.id, p.id) })

    // ── Step 4: Unique graph node descriptors ─────────────────
    const gNodeMap = new Map()
    couples.forEach(({ primary, spouse }) => {
      const gid = `couple-${primary.id}`
      gNodeMap.set(gid, { id: gid, type: 'couple', data: { primary, spouse }, w: COUPLE_W, h: NODE_H })
    })
    connected.forEach(p => {
      const gid = graphNodeFor.get(p.id)
      if (!gNodeMap.has(gid))
        gNodeMap.set(gid, { id: gid, type: 'single', data: { person: p }, w: SINGLE_W, h: NODE_H })
    })

    // ── Step 5: Dagre layout ──────────────────────────────────
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'LR', nodesep: 20, ranksep: 100, marginx: 60, marginy: 60 })
    g.setDefaultEdgeLabel(() => ({}))
    // Use COUPLE_W for all nodes so single cards left-align with couple cards
    gNodeMap.forEach(n => g.setNode(n.id, { width: COUPLE_W, height: n.h }))

    const edgeSeen  = new Set()
    const edgeDescs = []
    connected.forEach(p => {
      p.parentIds?.forEach(pid => {
        const src = graphNodeFor.get(pid)
        const tgt = graphNodeFor.get(p.id)
        if (!src || !tgt || src === tgt) return
        const key = `${src}->${tgt}`
        if (edgeSeen.has(key)) return
        edgeSeen.add(key)
        if (gNodeMap.has(src) && gNodeMap.has(tgt)) {
          g.setEdge(src, tgt)
          edgeDescs.push({ from: src, to: tgt })
        }
      })
    })

    dagre.layout(g)

    // ── Step 5.5: Reposition external spouse-ancestry near their attachment couple ─────
    // Problem: dagre places external in-law roots at rank 0 (far from their attachment).
    // Solution: after layout, nudge those nodes to sit just above the attachment couple.
    // Guards ensure we only touch truly external branches (e.g. Bush-Radley),
    // NOT Coy-descendant spouses whose ancestry IS the main tree.
    couples.forEach(({ primary, spouse }) => {
      // Guard: primary must have their own main-line parentIds (natural dagre placement)
      if (!primary.parentIds?.length) return
      if (!spouse.parentIds?.length)  return
      const coupleGid = `couple-${primary.id}`
      const attachPos = g.node(coupleGid)
      if (!attachPos) return

      // Build primary-line ancestor gids (the main Coy ancestry chain)
      const primaryLineGids = new Set()
      const walkPrimary = (personId) => {
        const gid = graphNodeFor.get(personId)
        if (!gid || gid === coupleGid || primaryLineGids.has(gid)) return
        primaryLineGids.add(gid)
        const p = byId[personId]; if (!p) return
        p.parentIds?.forEach(pid => walkPrimary(pid))
        if (p.spouseId && graphNodeFor.get(p.spouseId) === gid)
          byId[p.spouseId]?.parentIds?.forEach(pid => walkPrimary(pid))
      }
      primary.parentIds.forEach(pid => walkPrimary(pid))

      // Walk UP through spouse's ancestor chain
      const ancestryGids = new Set()
      const walkUp = (personId) => {
        const gid = graphNodeFor.get(personId)
        if (!gid || gid === coupleGid || ancestryGids.has(gid)) return
        ancestryGids.add(gid)
        const p = byId[personId]; if (!p) return
        p.parentIds?.forEach(pid => walkUp(pid))
        if (p.spouseId && graphNodeFor.get(p.spouseId) === gid)
          byId[p.spouseId]?.parentIds?.forEach(pid => walkUp(pid))
      }
      spouse.parentIds.forEach(pid => walkUp(pid))
      if (ancestryGids.size === 0) return

      // Guard: at least one ancestry root must be a dagre root (no predecessors)
      // AND not already part of the primary's main-line ancestors
      const hasExternalRoot = [...ancestryGids].some(gid =>
        (g.predecessors(gid)?.length ?? 0) === 0 && !primaryLineGids.has(gid)
      )
      if (!hasExternalRoot) return

      // Build allGids: ancestry nodes + any leaf-siblings (e.g. sarah-bush-lincoln)
      const allGids = new Set(ancestryGids)
      ancestryGids.forEach(gid => {
        g.successors(gid)?.forEach(child => {
          if (allGids.has(child) || child === coupleGid) return
          const grandkids = g.successors(child)?.filter(s => s !== coupleGid) ?? []
          if (grandkids.length === 0) allGids.add(child)
        })
      })

      // Group nodes by dagre rank column (X position)
      const byCol = new Map()
      allGids.forEach(gid => {
        const node = g.node(gid); if (!node) return
        const col = Math.round(node.x)
        if (!byCol.has(col)) byCol.set(col, { main: [], extra: [] })
        if (ancestryGids.has(gid)) byCol.get(col).main.push(gid)
        else                        byCol.get(col).extra.push(gid)
      })

      // Place main ancestry one row above attachment; extras (siblings) stack above that
      const baseY = attachPos.y - (NODE_H + 20)
      byCol.forEach(({ main, extra }) => {
        main.forEach(gid  => { const n = g.node(gid); if (n) n.y = baseY })
        extra.forEach((gid, i) => { const n = g.node(gid); if (n) n.y = baseY - (NODE_H + 20) * (i + 1) })
      })

      // Mark all nodes in this external branch as in-law
      allGids.forEach(gid => {
        const gn = gNodeMap.get(gid)
        if (gn) gn.isInLaw = true
      })
    })

    // ── Step 5.6: Group siblings by parent, resolve column collisions ────────
    // For each column, sort nodes so all children of the same parent are adjacent,
    // then re-space with a tighter gap within a family and a larger gap between
    // families. This makes it visually clear whose children are whose.
    const childToParent = new Map()
    edgeDescs.forEach(({ from, to }) => {
      if (!childToParent.has(to)) childToParent.set(to, from)
    })

    const WITHIN_GAP  = NODE_H + 18
    const BETWEEN_GAP = NODE_H + 60

    const colMap = new Map()
    gNodeMap.forEach(n => {
      const nd = g.node(n.id); if (!nd) return
      const col = Math.round(nd.x)
      if (!colMap.has(col)) colMap.set(col, [])
      colMap.get(col).push({ id: n.id, nd })
    })

    colMap.forEach(colNodes => {
      if (colNodes.length < 2) return

      // Sort by parent's Y position first (groups siblings together),
      // then by current Y within a family group.
      colNodes.sort((a, b) => {
        const pgA = childToParent.get(a.id)
        const pgB = childToParent.get(b.id)
        const pyA = pgA ? (g.node(pgA)?.y ?? a.nd.y) : a.nd.y
        const pyB = pgB ? (g.node(pgB)?.y ?? b.nd.y) : b.nd.y
        if (Math.abs(pyA - pyB) > 0.5) return pyA - pyB
        return a.nd.y - b.nd.y
      })

      // Re-space from top: tight gap within a family, large gap between families.
      let currentY = colNodes[0].nd.y
      let prevParent = childToParent.get(colNodes[0].id)
      colNodes[0].nd.y = currentY

      for (let i = 1; i < colNodes.length; i++) {
        const thisParent = childToParent.get(colNodes[i].id)
        currentY += (thisParent !== prevParent) ? BETWEEN_GAP : WITHIN_GAP
        colNodes[i].nd.y = currentY
        prevParent = thisParent
      }
    })

    // ── Step 6: React Flow nodes ──────────────────────────────
    const rfNodes = []
    gNodeMap.forEach(n => {
      const { x, y } = g.node(n.id)
      rfNodes.push({ id: n.id, type: n.type, data: { ...n.data, isInLaw: !!n.isInLaw }, position: { x: x - COUPLE_W / 2, y: y - n.h / 2 } })
    })

    // ── Step 7: React Flow edges (color-coded by parent couple) ──────────────
    // Each parent couple gets a unique color so you can trace whose children
    // are whose across a busy generation. Main-line stays amber.
    const BRANCH_PALETTE = [
      'rgba(59,130,246,0.55)',   // blue
      'rgba(16,185,129,0.55)',   // emerald
      'rgba(168,85,247,0.55)',   // purple
      'rgba(244,63,94,0.55)',    // rose
      'rgba(6,182,212,0.55)',    // cyan
      'rgba(249,115,22,0.55)',   // orange
      'rgba(52,211,153,0.55)',   // teal
      'rgba(236,72,153,0.55)',   // pink
      'rgba(132,204,22,0.55)',   // lime
      'rgba(251,191,36,0.35)',   // dim amber (fallback)
    ]
    const parentColor = new Map()
    let paletteIdx = 0

    const rfEdges = edgeDescs.map(({ from, to }) => {
      const tgt    = gNodeMap.get(to)
      const isMain = tgt?.data?.primary?.isMainLine || tgt?.data?.person?.isMainLine

      let stroke, strokeWidth
      if (isMain) {
        stroke = 'rgba(245,158,11,0.55)'
        strokeWidth = 2
      } else {
        if (!parentColor.has(from)) {
          parentColor.set(from, BRANCH_PALETTE[paletteIdx % BRANCH_PALETTE.length])
          paletteIdx++
        }
        stroke = parentColor.get(from)
        strokeWidth = 1.5
      }

      return {
        id: `e-${from}-${to}`,
        source: from, sourceHandle: 'right',
        target: to,   targetHandle: 'left',
        type: 'smoothstep',
        style: { stroke, strokeWidth },
      }
    })

    return { initialNodes: rfNodes, initialEdges: rfEdges }
  }, [])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const handleNodeClick = useCallback((event, node) => {
    const { data } = node
    if (node.type === 'couple') {
      // Determine which panel was clicked via data-person-role attribute
      const role = event.target.closest('[data-person-role]')?.dataset.personRole
      setSelectedPerson(role === 'spouse' ? data.spouse : data.primary)
    } else {
      setSelectedPerson(data.person)
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', background: '#0c0c0c' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.04}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background color="#161616" variant={BackgroundVariant.Dots} gap={28} size={1} />
        <Controls
          showInteractive={false}
          style={{ background: '#111', border: '1px solid #222', borderRadius: 8 }}
        />
        <MiniMap
          style={{ background: '#111', border: '1px solid #222', borderRadius: 8 }}
          nodeColor={n => n.data?.primary?.isMainLine || n.data?.person?.isMainLine ? '#f59e0b' : '#2a2a2a'}
          maskColor="rgba(0,0,0,0.75)"
        />
      </ReactFlow>
      <PersonModal person={selectedPerson} onClose={() => setSelectedPerson(null)} />
    </div>
  )
}
