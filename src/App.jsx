import { useState, useEffect, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Polygon, Marker, Tooltip, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import { people, PLACES } from './data'
import TreeView from './TreeView'

const MIN_YEAR = 1590
const MAX_YEAR = 1960

const EVENTS = [
  { year: 1620, label: "Mayflower", desc: "102 Puritan settlers land at Plymouth, MA — the generation that brings Matthew Coy I to New England." },
  { year: 1633, label: "The Griffin", desc: "Carries Elizabeth Bulkeley Whittingham to Boston, 1633. Her son John Whittingham later organizes the 1638 group migration from Lincolnshire that brings Matthew and Richard Coy to New England." },
  { year: 1635, label: "The Planter", desc: "118 Puritan emigrants depart London, arriving Boston June 7, 1635. Carries the Haffield family including 8-year-old Martha Haffield, who will grow up to marry Richard Coy. Her 6-year-old sister Rachel later becomes Rachel Clinton — imprisoned during the Salem Witch Trials." },
  { year: 1675, label: "King Philip's War", desc: "Deadliest conflict per capita in American history. Richard Coy II and his son John are killed in the Quaboag raid (Aug. 1675), one of the war's first major attacks. Surviving family is pushed south and west." },
  { year: 1686, label: "Dominion of New England", desc: "King James II dissolves colonial charters and merges all New England colonies under royal Governor Edmund Andros. Local assemblies are abolished, land titles threatened. Deep resentment builds across the region where the Coys lived." },
  { year: 1689, label: "Boston Revolt", desc: "News of England's Glorious Revolution reaches Boston. Colonists overthrow Governor Andros, imprison him, and restore self-rule. A preview of the revolutionary spirit that will define 1776." },
  { year: 1690, label: "King William's War", desc: "First major Anglo-French colonial war. French and Abenaki forces raid New England towns across Essex County — the same area where the Coy family lived in Ipswich and Wenham." },
  { year: 1692, label: "Salem Witch Trials", desc: "Hysteria spreads across Essex County, MA. Wenham — where Elizabeth Roberts Coy lived — sits miles from Salem. Rachel Haffield Clinton, sister-in-law of Richard Coy and a Planter passenger as a child, was arrested May 28, 1692 and imprisoned in Ipswich Gaol. She died destitute in 1694." },
  { year: 1704, label: "Deerfield Massacre", desc: "French and Native forces raid Deerfield, MA at dawn, killing 50 and marching 100 captives to Canada in winter. Deerfield is 40 miles from Quaboag where Richard Coy II was killed in 1675 — the same frontier the Coys had fled." },
  { year: 1733, label: "The Great Awakening", desc: "Sweeping religious revival led by George Whitefield and Jonathan Edwards fractures New England Puritan congregations, reshapes colonial identity, and plants seeds of individualism that feed the Revolution." },
  { year: 1754, label: "French & Indian War", desc: "Britain defeats France for control of North America, opening lands west of the Appalachians to settlement." },
  { year: 1763, label: "Proclamation Line", desc: "Britain forbids colonial settlement west of the Appalachians after the French & Indian War. Intended to pacify Native tribes, it enrages colonists who fought the war expecting western land. Directly fuels revolutionary resentment." },
  { year: 1765, label: "Stamp Act", desc: "First direct British tax on colonial documents, newspapers, and legal papers. Spark for organized colonial resistance — 'no taxation without representation' — and forerunner of revolution." },
  { year: 1770, label: "Boston Massacre", desc: "British soldiers fire into a crowd on King Street, killing five colonists. Patriot leaders including Paul Revere and Samuel Adams use it to galvanize anti-British sentiment across New England." },
  { year: 1773, label: "Boston Tea Party", desc: "Sons of Liberty dump 342 chests of East India Company tea into Boston Harbor to protest the Tea Act. Britain responds with the Coercive Acts, further uniting the colonies against crown rule." },
  { year: 1775, label: "Lexington & Concord", desc: "The first shots of the American Revolution are fired at Lexington and Concord, MA on April 19, 1775. British troops march to seize colonial arms; Minutemen block their path. 'The shot heard round the world.'" },
  { year: 1776, label: "Independence", desc: "The 13 colonies declare independence from Britain. The United States of America is born." },
  { year: 1781, label: "Siege of Yorktown", desc: "Final major battle of the Revolution. Christopher Coy served here, helping secure American independence." },
  { year: 1787, label: "Northwest Ordinance", desc: "Organizes the territory north of the Ohio River — future Indiana, Illinois, Michigan, Ohio, and Wisconsin." },
  { year: 1793, label: "Cotton Gin", desc: "Eli Whitney's cotton gin makes large-scale cotton farming profitable, entrenching slavery across the South and reshaping American agriculture and politics for the next 70 years." },
  { year: 1796, label: "Smallpox Vaccine", desc: "Edward Jenner develops the first vaccine. Smallpox had devastated colonial communities — the 1721 Boston epidemic killed hundreds and sparked one of America's earliest public health controversies." },
  { year: 1803, label: "Louisiana Purchase", desc: "U.S. acquires 828,000 sq mi from France, doubling in size and opening the entire Mississippi interior to settlement." },
  { year: 1804, label: "Lewis & Clark", desc: "Meriwether Lewis and William Clark depart St. Louis (May 1804), commissioned by Jefferson to explore the Louisiana Purchase. They follow the Missouri River, cross the Rockies via Lemhi Pass, descend the Columbia to the Pacific, and return by September 1806 — mapping the first overland route west." },
  { year: 1807, label: "Steamboat", desc: "Robert Fulton's Clermont makes the first successful steamboat voyage on the Hudson River. Within a decade, steamboats dominate the Ohio and Mississippi rivers — the same waterways the Coy family used to travel west into Kentucky and Illinois." },
  { year: 1811, label: "National Road", desc: "First federally funded highway, running from Maryland to Illinois. The primary overland route west for a generation." },
  { year: 1825, label: "Erie Canal", desc: "Connects the Great Lakes to NYC, slashing freight costs and triggering mass migration into the Midwest." },
  { year: 1830, label: "Indian Removal Act", desc: "Forces Native tribes from the Midwest, opening Kentucky, Indiana, and Illinois farmland to white settlement." },
  { year: 1831, label: "McCormick Reaper", desc: "Cyrus McCormick's mechanical reaper transforms wheat farming — cutting harvest time from weeks to days. Directly enables the Midwestern grain boom that made Illinois farmland, including Clay County where the Coys farmed, enormously productive." },
  { year: 1837, label: "Telegraph", desc: "Samuel Morse demonstrates the electric telegraph, enabling near-instant communication across vast distances for the first time. By the 1850s, telegraph lines follow the railroads west, connecting frontier settlements to the east." },
  { year: 1856, label: "Illinois Central RR", desc: "First land-grant railroad, running through Clay County, IL — where the Coys farmed — north to Chicago." },
  { year: 1861, label: "Civil War", desc: "Four-year war between Union and Confederacy. Many southern Illinois families had economic and family ties to both sides." },
  { year: 1869, label: "Transcontinental RR", desc: "Central and Union Pacific connect at Promontory Summit, UT — making the American West reachable in days from the Midwest." },
  { year: 1879, label: "Light Bulb", desc: "Thomas Edison demonstrates a practical incandescent light bulb. Three years later his Pearl Street power station in NYC brings electricity to city blocks — beginning the transformation of daily American life." },
  { year: 1883, label: "Northern Pacific RR", desc: "Second transcontinental line through the Pacific Northwest, directly opening Idaho Territory to Midwest settlers." },
  { year: 1885, label: "Automobile", desc: "Karl Benz builds the first true gasoline-powered automobile. Within 20 years, cars will begin replacing horses on American roads — and within 30, Model T Fords are rolling off assembly lines affordable to working families like the Coys." },
  { year: 1893, label: "Economic Panic", desc: "Bank collapses and a severe depression crush Illinois grain prices, driving farm families to seek cheaper western land." },
  { year: 1903, label: "Potlatch Lumber Co.", desc: "Founded near Lewiston, ID to harvest the vast Clearwater timber stands. Actively recruited Midwestern workers and built a full company town." },
  { year: 1903, label: "First Airplane", desc: "Orville and Wilbur Wright achieve the first powered, controlled airplane flight at Kitty Hawk, NC on December 17, 1903 — 12 seconds, 120 feet. The age of flight begins." },
  { year: 1908, label: "Camas Prairie RR", desc: "Railroad reaches the fertile Camas Prairie plateau above Lewiston — making Winchester, ID accessible and farmable almost overnight." },
  { year: 1908, label: "Model T Ford", desc: "Henry Ford releases the Model T — the first car mass-produced at a price working families could afford. By 1927, 15 million are sold. The Coys in Idaho would have seen their first cars during this era." },
  { year: 1910, label: "Big Blowup Fire", desc: "Catastrophic firestorm burns 3 million acres across Idaho and Montana in 48 hours, creating a surge in Lewiston-area logging and rebuilding work." },
]

// Group same-year events so tick marks don't duplicate keys or overlap labels
const EVENT_GROUPS = (() => {
  const seen = new Map()
  EVENTS.forEach(e => {
    if (!seen.has(e.year)) seen.set(e.year, [])
    seen.get(e.year).push(e)
  })
  return Array.from(seen.values()).map(evs => ({ year: evs[0].year, events: evs }))
})()

const ORIGINAL_COLONIES = new Set([
  'New Hampshire', 'Massachusetts', 'Rhode Island', 'Connecticut',
  'New York', 'New Jersey', 'Pennsylvania', 'Delaware', 'Maryland',
  'Virginia', 'North Carolina', 'South Carolina', 'Georgia',
])

const EVENT_OVERLAYS = [
  // ── Point events ───────────────────────────────────────────
  {
    id: 'mayflower',
    type: 'ship',
    yearFrom: 1620, yearTo: 1625,
    label: 'Mayflower Landing',
    sub: '1620 · Plymouth, MA · Brings the generation that leads to Matthew Coy I',
    center: [41.96, -70.67],
  },
  {
    id: 'the-griffin',
    type: 'ship',
    yearFrom: 1633, yearTo: 1638,
    label: 'The Griffin arrives',
    sub: '1633 · Boston, MA · Carries Elizabeth Bulkeley Whittingham, whose son John Whittingham organizes the 1638 group migration that brings the Coy brothers to New England.',
    center: [42.38, -71.04],
  },
  {
    id: 'the-planter',
    type: 'ship',
    yearFrom: 1635, yearTo: 1642,
    label: 'The Planter arrives',
    sub: '1635 · Boston, MA · Carries 8-year-old Martha Haffield, future wife of Richard Coy. Her sister Rachel later imprisoned in the Salem Witch Trials.',
    center: [42.36, -71.06],
  },
  {
    id: 'king-williams-war',
    type: 'battle',
    yearFrom: 1690, yearTo: 1697,
    label: "King William's War",
    sub: "1690–1697 · French & Abenaki raids across Essex County, MA — Coy family territory",
    center: [43.8, -71.2],
  },
  {
    id: 'deerfield-massacre',
    type: 'battle',
    yearFrom: 1704, yearTo: 1704,
    label: 'Deerfield Massacre',
    sub: '1704 · Deerfield, MA · French & Native raid kills 50, captures 100 — 40 miles from Quaboag',
    center: [42.54, -72.61],
  },
  {
    id: 'boston-massacre',
    type: 'battle',
    yearFrom: 1770, yearTo: 1770,
    label: 'Boston Massacre',
    sub: '1770 · King Street, Boston · British soldiers fire on colonists, killing five',
    center: [42.36, -71.06],
  },
  {
    id: 'boston-tea-party',
    type: 'battle',
    yearFrom: 1773, yearTo: 1773,
    label: 'Boston Tea Party',
    sub: '1773 · Boston Harbor · Sons of Liberty dump 342 chests of British tea',
    center: [42.35, -71.05],
  },
  {
    id: 'lexington-concord',
    type: 'battle',
    yearFrom: 1775, yearTo: 1775,
    label: 'Lexington & Concord',
    sub: '1775 · Lexington & Concord, MA · First shots of the American Revolution',
    center: [42.45, -71.30],
  },
  {
    id: 'king-philips-war',
    type: 'battle',
    yearFrom: 1675, yearTo: 1676,
    label: "King Philip's War",
    sub: '1675–1676 · New England',
    center: [42.2, -72.1],
  },
  {
    id: 'salem-trials',
    type: 'candle',
    yearFrom: 1692, yearTo: 1693,
    label: 'Salem Witch Trials',
    sub: '1692–1693 · Rachel Haffield Clinton — Richard Coy\'s sister-in-law, a Planter passenger as a child — imprisoned in Ipswich Gaol',
    center: [42.52, -70.9],
  },
  {
    id: 'yorktown',
    type: 'battle',
    yearFrom: 1781, yearTo: 1782,
    label: 'Siege of Yorktown',
    sub: '1781 · Christopher Coy served here',
    center: [37.24, -76.50],
  },
  {
    id: 'french-indian-war',
    type: 'battle',
    yearFrom: 1754, yearTo: 1763,
    label: 'French & Indian War',
    sub: '1754–1763 · Eastern frontier',
    center: [43.5, -76.0],
  },
  {
    id: 'civil-war-bull-run',
    type: 'battle',
    yearFrom: 1861, yearTo: 1865,
    label: 'Bull Run',
    sub: 'Civil War · 1861 & 1862 · Prince William County, VA',
    center: [38.81, -77.52],
  },
  {
    id: 'civil-war-antietam',
    type: 'battle',
    yearFrom: 1862, yearTo: 1865,
    label: 'Antietam',
    sub: 'Civil War · Sept 1862 · Bloodiest single day of the war',
    center: [39.47, -77.74],
  },
  {
    id: 'civil-war-gettysburg',
    type: 'battle',
    yearFrom: 1863, yearTo: 1865,
    label: 'Gettysburg',
    sub: 'Civil War · July 1863 · Turning point of the eastern theater',
    center: [39.83, -77.23],
  },
  {
    id: 'civil-war-fredericksburg',
    type: 'battle',
    yearFrom: 1862, yearTo: 1865,
    label: 'Fredericksburg / Chancellorsville',
    sub: 'Civil War · 1862–1863 · Central Virginia front',
    center: [38.30, -77.46],
  },
  {
    id: 'civil-war-petersburg',
    type: 'battle',
    yearFrom: 1864, yearTo: 1865,
    label: 'Petersburg / Appomattox',
    sub: 'Civil War · 1864–1865 · Final campaign; Lee surrenders Apr 1865',
    center: [37.22, -77.40],
  },
  {
    id: 'civil-war-shiloh',
    type: 'battle',
    yearFrom: 1862, yearTo: 1865,
    label: 'Shiloh',
    sub: 'Civil War · Apr 1862 · Western Tennessee; Grant\'s brutal early campaign',
    center: [35.14, -88.34],
  },
  {
    id: 'civil-war-nashville',
    type: 'battle',
    yearFrom: 1862, yearTo: 1865,
    label: 'Nashville / Stones River',
    sub: 'Civil War · 1862–1864 · Key western theater hub',
    center: [36.16, -86.78],
  },
  {
    id: 'civil-war-vicksburg',
    type: 'battle',
    yearFrom: 1863, yearTo: 1865,
    label: 'Vicksburg',
    sub: 'Civil War · 1863 · Grant splits the Confederacy along the Mississippi',
    center: [32.35, -90.88],
  },
  {
    id: 'civil-war-atlanta',
    type: 'battle',
    yearFrom: 1864, yearTo: 1865,
    label: 'Atlanta / Sherman\'s March',
    sub: 'Civil War · 1864 · Sherman burns Atlanta and marches to Savannah',
    center: [33.75, -84.39],
  },
  {
    id: 'civil-war-missouri',
    type: 'battle',
    yearFrom: 1861, yearTo: 1865,
    label: 'Missouri / Kansas Border War',
    sub: 'Civil War · 1861–1865 · Brutal guerrilla fighting; split loyalties near Illinois',
    center: [38.50, -93.50],
  },
  {
    id: 'big-blowup',
    type: 'fire',
    yearFrom: 1910, yearTo: 1913,
    label: 'Big Blowup Fire',
    sub: '1910 · 3M acres, ID & MT',
    center: [47.2, -115.5],
  },

  // ── Inventions ─────────────────────────────────────────────
  {
    id: 'invention-cotton-gin',
    type: 'cotton-gin',
    yearFrom: 1793, yearTo: 1815,
    label: 'Cotton Gin',
    sub: '1793 · Mulberry Grove, GA · Eli Whitney\'s gin makes large-scale cotton farming profitable, entrenching slavery across the South',
    center: [32.14, -81.42],
  },
  {
    id: 'invention-reaper',
    type: 'reaper',
    yearFrom: 1831, yearTo: 1855,
    label: 'McCormick Reaper',
    sub: '1831 · Rockbridge County, VA · Mechanical reaper cuts harvest time from weeks to days, fueling the Midwestern grain boom',
    center: [37.78, -79.44],
  },
  {
    id: 'invention-telegraph',
    type: 'telegraph',
    yearFrom: 1837, yearTo: 1870,
    label: 'Telegraph',
    sub: '1837 · New York, NY · Morse\'s electric telegraph enables near-instant communication across vast distances for the first time',
    center: [40.74, -74.00],
  },
  {
    id: 'invention-light-bulb',
    type: 'light-bulb',
    yearFrom: 1879, yearTo: 1900,
    label: 'Light Bulb',
    sub: '1879 · Menlo Park, NJ · Edison\'s practical incandescent bulb; his Pearl Street plant brings electricity to city blocks by 1882',
    center: [40.56, -74.35],
  },
  {
    id: 'invention-automobile',
    type: 'automobile',
    yearFrom: 1885, yearTo: 1907,
    label: 'Automobile',
    sub: '1885 · Karl Benz builds the first gasoline automobile. Within 20 years, cars are replacing horses on American roads',
    center: [42.33, -83.05],
  },
  {
    id: 'invention-airplane',
    type: 'airplane',
    yearFrom: 1903, yearTo: 1920,
    label: 'First Airplane',
    sub: '1903 · Kitty Hawk, NC · Wright Brothers achieve the first powered flight — 12 seconds, 120 feet. The age of flight begins',
    center: [36.02, -75.67],
  },
  {
    id: 'invention-model-t',
    type: 'model-t',
    yearFrom: 1908, yearTo: 1928,
    label: 'Model T Ford',
    sub: '1908 · Detroit, MI · First mass-affordable automobile; 15 million sold by 1927. The Coys in Idaho would have seen their first cars in this era',
    center: [42.38, -83.10],
  },
]

const makeIcon = (emoji, cls) => L.divIcon({
  className: `overlay-marker overlay-marker-${cls}`,
  html: `<div class="overlay-pulse"></div><span class="overlay-emoji">${emoji}</span>`,
  iconSize: [36, 36], iconAnchor: [18, 18],
})

const OVERLAY_ICONS = {
  ship:        makeIcon('⛵',  'ship'),
  fire:        makeIcon('🔥', 'fire'),
  battle:      makeIcon('⚔️', 'battle'),
  candle:      makeIcon('🕯️', 'candle'),
  'cotton-gin': makeIcon('⚙️', 'invention'),
  reaper:       makeIcon('🌾', 'invention'),
  telegraph:    makeIcon('⚡', 'invention'),
  'light-bulb': makeIcon('💡', 'invention'),
  automobile:   makeIcon('🚗', 'invention'),
  airplane:     makeIcon('✈️', 'invention'),
  'model-t':    makeIcon('🏭', 'invention'),
}

const STEAMBOAT_RIVERS = [
  {
    id: 'hudson',
    name: 'Hudson River',
    note: 'Fulton\'s Clermont made its first voyage here in 1807 — Albany to NYC in 32 hours',
    positions: [
      [43.90, -74.10], // Lake Tear of the Clouds (source)
      [43.08, -73.99], // Glens Falls
      [42.65, -73.75], // Albany
      [42.25, -73.95], // Hudson
      [41.70, -73.93], // Poughkeepsie
      [41.36, -73.96], // Peekskill
      [40.72, -74.00], // New York City
    ],
  },
  {
    id: 'mississippi',
    name: 'Mississippi River',
    note: 'Steamboats transformed this river into the main commercial highway linking the Midwest to New Orleans',
    positions: [
      [47.23, -95.21], // Lake Itasca, MN (source)
      [44.98, -93.27], // Minneapolis
      [43.55, -91.23], // La Crosse, WI
      [42.50, -90.67], // Dubuque, IA
      [41.52, -90.58], // Davenport, IA
      [39.94, -91.41], // Quincy, IL
      [38.63, -90.20], // St. Louis, MO
      [36.88, -89.19], // Cairo, IL (Ohio confluence)
      [35.15, -90.05], // Memphis, TN
      [32.36, -90.88], // Vicksburg, MS
      [31.56, -91.39], // Natchez, MS
      [29.95, -90.07], // New Orleans, LA
    ],
  },
  {
    id: 'ohio',
    name: 'Ohio River',
    note: 'The Ohio was the main artery for Coy family migration from Maryland/Virginia into Kentucky and Illinois',
    positions: [
      [40.44, -80.00], // Pittsburgh, PA (Allegheny/Monongahela confluence)
      [40.08, -80.73], // Wheeling, WV
      [39.10, -84.51], // Cincinnati, OH
      [38.02, -85.76], // Louisville, KY
      [37.77, -87.11], // Owensboro, KY
      [37.80, -87.58], // Evansville, IN
      [37.12, -88.56], // Paducah, KY (Mississippi confluence)
    ],
  },
]

const EXPEDITIONS = [
  {
    id: 'lewis-clark-outbound',
    name: 'Lewis & Clark — Outbound',
    note: '1804–1805 · St. Louis → Fort Clatsop, OR via Missouri River & Columbia River',
    yearFrom: 1804, yearTo: 1806,
    positions: [
      [38.63, -90.20],   // St. Louis, MO (Camp Dubois)
      [38.89, -92.32],   // Jefferson City, MO
      [39.10, -94.58],   // Kansas City, MO
      [40.43, -95.37],   // Nebraska City, NE
      [41.26, -95.94],   // Omaha / Council Bluffs
      [42.50, -96.40],   // Sioux City, IA
      [43.55, -98.85],   // Fort Thompson, SD
      [44.37, -100.34],  // Pierre, SD
      [45.46, -100.39],  // Mobridge, SD
      [46.81, -100.79],  // Fort Mandan, ND (winter 1804–05)
      [47.52, -102.40],  // Stanley, ND
      [48.15, -103.62],  // Williston, ND
      [47.87, -106.96],  // Jordan, MT
      [47.50, -111.30],  // Great Falls, MT
      [46.86, -112.00],  // Helena, MT
      [45.93, -111.55],  // Three Forks, MT (Missouri headwaters)
      [44.99, -113.46],  // Lemhi Pass (Continental Divide)
      [45.17, -113.89],  // Salmon, ID
      [46.40, -115.50],  // Lolo Trail, ID
      [46.47, -116.85],  // Weippe Prairie, ID
      [46.42, -117.02],  // Lewiston / Clarkston (Snake & Clearwater confluence)
      [46.20, -118.98],  // Kennewick / Pasco (Snake & Columbia confluence)
      [45.68, -120.83],  // The Dalles, OR
      [45.52, -122.68],  // Portland, OR
      [46.14, -123.88],  // Fort Clatsop (near Astoria, OR)
    ],
  },
  {
    id: 'lewis-clark-return-clark',
    name: 'Lewis & Clark — Clark\'s Return (Yellowstone)',
    note: '1806 · Clark\'s return route via Yellowstone River',
    yearFrom: 1806, yearTo: 1806,
    positions: [
      [46.14, -123.88],  // Fort Clatsop, OR
      [46.42, -117.02],  // Lewiston, ID
      [44.99, -113.46],  // Lemhi Pass
      [45.68, -111.45],  // Bozeman area
      [45.79, -108.50],  // Billings, MT (Yellowstone River)
      [46.91, -104.10],  // Glendive, MT (Yellowstone)
      [47.99, -103.83],  // Yellowstone / Missouri confluence
      [46.81, -100.79],  // Fort Mandan, ND
      [44.37, -100.34],  // Pierre, SD
      [41.26, -95.94],   // Omaha
      [38.63, -90.20],   // St. Louis, MO
    ],
  },
]

const HIGHWAYS = [
  {
    id: 'national-road-1',
    name: 'National Road',
    note: 'Cumberland, MD → Wheeling, WV',
    year: 1818,
    positions: [
      [39.65, -78.76], // Cumberland, MD
      [39.90, -79.73], // Uniontown, PA
      [40.06, -80.72], // Wheeling, WV
    ],
  },
  {
    id: 'national-road-2',
    name: 'National Road',
    note: 'Wheeling, WV → Columbus, OH',
    year: 1825,
    positions: [
      [40.06, -80.72], // Wheeling, WV
      [39.94, -82.01], // Zanesville, OH
      [39.96, -82.99], // Columbus, OH
    ],
  },
  {
    id: 'national-road-3',
    name: 'National Road',
    note: 'Columbus, OH → Indianapolis, IN',
    year: 1831,
    positions: [
      [39.96, -82.99], // Columbus, OH
      [39.92, -83.81], // Springfield, OH
      [39.83, -84.90], // Richmond, IN
      [39.77, -86.16], // Indianapolis, IN
    ],
  },
  {
    id: 'national-road-4',
    name: 'National Road',
    note: 'Indianapolis, IN → Vandalia, IL',
    year: 1838,
    positions: [
      [39.77, -86.16], // Indianapolis, IN
      [39.47, -87.41], // Terre Haute, IN
      [39.39, -87.69], // Marshall, IL
      [38.96, -89.10], // Vandalia, IL
    ],
  },
]

const RAILROADS = [
  {
    id: 'illinois-central',
    name: 'Illinois Central RR',
    year: 1856,
    positions: [
      [37.00, -89.18], // Cairo, IL
      [37.73, -89.22], // Carbondale
      [38.32, -88.90], // Mt. Vernon
      [39.12, -88.54], // Effingham
      [40.12, -88.24], // Champaign
      [41.88, -87.63], // Chicago
    ],
  },
  {
    id: 'chicago-omaha',
    name: 'Chicago & North Western',
    year: 1869,
    positions: [
      [41.88, -87.63], // Chicago, IL
      [41.84, -90.19], // Clinton, IA
      [41.98, -91.66], // Cedar Rapids, IA
      [42.06, -93.88], // Boone, IA
      [41.26, -95.86], // Council Bluffs, IA / Omaha
    ],
  },
  {
    id: 'transcontinental',
    name: 'Transcontinental RR',
    year: 1869,
    positions: [
      [41.26, -95.94],  // Omaha, NE
      [40.70, -99.08],  // Kearney, NE
      [41.13, -100.77], // North Platte, NE
      [41.31, -105.59], // Laramie, WY
      [41.22, -111.97], // Ogden, UT
      [40.83, -115.76], // Elko, NV
      [38.58, -121.49], // Sacramento, CA
    ],
  },
  {
    id: 'utah-northern',
    name: 'Utah & Northern RR',
    year: 1881,
    positions: [
      [41.22, -111.97], // Ogden, UT
      [41.74, -111.83], // Logan, UT
      [42.10, -111.88], // Preston, ID
      [42.87, -112.45], // Pocatello, ID
      [43.19, -112.35], // Blackfoot, ID
      [43.49, -112.03], // Idaho Falls, ID
      [45.22, -112.64], // Dillon, MT
      [46.00, -112.54], // Butte, MT
    ],
  },
  {
    id: 'oregon-short-line',
    name: 'Oregon Short Line',
    year: 1884,
    positions: [
      [41.60, -109.97], // Granger, WY (UP junction)
      [42.87, -112.45], // Pocatello, ID (U&N junction)
      [42.94, -114.41], // Shoshone, ID
      [43.61, -116.20], // Boise, ID
      [44.02, -116.96], // Ontario, OR
      [44.36, -117.51], // Huntington, OR (OR&N junction)
    ],
  },
  {
    id: 'orn-main',
    name: 'Oregon Ry & Navigation Co.',
    year: 1884,
    positions: [
      [45.52, -122.68], // Portland, OR
      [45.71, -121.52], // Hood River, OR
      [45.59, -121.18], // The Dalles, OR
      [45.67, -118.79], // Pendleton, OR
      [46.08, -118.90], // Wallula, WA (Snake/Columbia junction)
      [45.32, -118.09], // La Grande, OR
      [44.78, -117.83], // Baker City, OR
      [44.36, -117.51], // Huntington, OR (OSL junction)
    ],
  },
  {
    id: 'orn-lewiston',
    name: 'Oregon Ry & Navigation Co. — Lewiston Branch',
    year: 1884,
    positions: [
      [46.08, -118.90], // Wallula, WA
      [46.38, -118.07], // Snake River canyon
      [46.42, -117.02], // Lewiston, ID
    ],
  },
]

function sameCoords(a, b) {
  return a && b && Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lng - b.lng) < 0.01
}

function formatYears(p) {
  const b = p.birth.year ?? '?'
  const d = p.death.year ?? '?'
  return `${b}–${d}`
}

export default function App() {
  const [year, setYear] = useState(1750)
  const [selectedId, setSelectedId] = useState(null)
  const [viewMode, setViewMode] = useState('map')
  const [coloniesGeoJson,       setColoniesGeoJson]       = useState(null)
  const [northwestGeoJson,      setNorthwestGeoJson]      = useState(null)
  const [louisianaGeoJson,      setLouisianaGeoJson]      = useState(null)
  const [indianRemovalGeoJson,  setIndianRemovalGeoJson]  = useState(null)
  const [riversGeoJson,         setRiversGeoJson]         = useState(null)

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
      .then(r => r.json())
      .then(data => {
        const filter = names => ({
          ...data,
          features: data.features.filter(f => names.has(f.properties.name)),
        })
        setColoniesGeoJson(filter(ORIGINAL_COLONIES))
        setNorthwestGeoJson(filter(new Set([
          'Ohio', 'Indiana', 'Illinois', 'Michigan', 'Wisconsin',
        ])))
        setLouisianaGeoJson(filter(new Set([
          'Louisiana', 'Arkansas', 'Missouri', 'Iowa', 'Minnesota',
          'North Dakota', 'South Dakota', 'Nebraska', 'Kansas',
          'Oklahoma', 'Colorado', 'Montana', 'Wyoming',
        ])))
        setIndianRemovalGeoJson(filter(new Set([
          'Georgia', 'Alabama', 'Mississippi', 'Tennessee', 'Florida', 'North Carolina',
        ])))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const RIVER_NAMES = new Set(['Mississippi', 'Ohio', 'Hudson'])
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson')
      .then(r => r.json())
      .then(data => setRiversGeoJson({
        ...data,
        features: data.features.filter(f => RIVER_NAMES.has(f.properties.name)),
      }))
      .catch(() => {})
  }, [])

  const handleSlider = useCallback(e => setYear(Number(e.target.value)), [])

  const activeOverlays = useMemo(
    () => EVENT_OVERLAYS.filter(o => year >= o.yearFrom && (!o.yearTo || year <= o.yearTo)),
    [year]
  )

  const nearestYear = useMemo(() => {
    const nearest = EVENT_GROUPS.reduce((c, g) =>
      Math.abs(g.year - year) < Math.abs(c.year - year) ? g : c
    )
    return Math.abs(nearest.year - year) <= 15 ? nearest.year : null
  }, [year])
  const handleSelect = useCallback(id => setSelectedId(prev => prev === id ? null : id), [])

  const visible = useMemo(
    () => people.filter(p => p.birth.year && p.birth.year <= year),
    [year]
  )

  const alive = useMemo(
    () => visible.filter(p => !p.death.year || p.death.year > year),
    [visible, year]
  )

  const deceased = useMemo(
    () => visible.filter(p => p.death.year && p.death.year <= year),
    [visible, year]
  )

  const selected = selectedId ? people.find(p => p.id === selectedId) : null

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">Coy Family Tree</div>
          <div className="sidebar-year">{year}</div>
          <div className="sidebar-counts">
            <span className="count-pill alive">{alive.length} alive</span>
            <span className="count-pill dead">{deceased.length} deceased</span>
          </div>
          <div className="view-toggle">
            <button className={`view-btn${viewMode === 'map' ? ' active' : ''}`} onClick={() => setViewMode('map')}>Map</button>
            <button className={`view-btn${viewMode === 'tree' ? ' active' : ''}`} onClick={() => setViewMode('tree')}>Tree</button>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="empty-state">No records before {year}</div>
        ) : (
          <ul className="person-list">
            {visible.map(p => {
              const bp = p.birth.place ? PLACES[p.birth.place] : null
              const dp = p.death.place ? PLACES[p.death.place] : null
              const isDead = p.death.year && p.death.year <= year
              return (
                <li
                  key={p.id}
                  className={`person-item ${p.id === selectedId ? 'selected' : ''} ${p.isMainLine ? 'main-line' : ''}`}
                  onClick={() => handleSelect(p.id)}
                >
                  <div className="person-name">{p.name}</div>
                  <div className="person-dates" style={{ color: isDead ? '#555' : '#999' }}>
                    {formatYears(p)}
                  </div>
                  <div className="person-places">
                    {bp && <span className="birth-place">{bp.label}</span>}
                    {bp && dp && <span className="place-sep">→</span>}
                    {dp && <span className="death-place">{dp.label}</span>}
                  </div>
                  {p.tags.length > 0 && (
                    <div className="person-tags">
                      {p.tags.map(t => <span key={t} className={`tag ${t}`}>{t}</span>)}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      {/* Map / Tree */}
      <div className="map-wrap">
        {viewMode === 'tree' ? <TreeView /> : <MapContainer
          center={[45, -55]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />

          {/* Northwest Territory */}
          {year >= 1787 && northwestGeoJson && (() => {
            const active = Math.abs(year - 1787) <= 20
            return <GeoJSON key={`northwest-${active}`} data={northwestGeoJson}
              style={{ color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: active ? 0.08 : 0.03, weight: active ? 0.6 : 0, opacity: active ? 0.3 : 0 }}
              onEachFeature={(f, l) => l.bindTooltip(
                `<div class="tooltip-name">Northwest Territory</div><div class="tooltip-sub">${f.properties.name} · Opened by Northwest Ordinance 1787</div>`,
                { sticky: true, className: 'leaflet-tooltip' }
              )}
            />
          })()}

          {/* Louisiana Purchase */}
          {year >= 1803 && louisianaGeoJson && (() => {
            const active = Math.abs(year - 1803) <= 20
            return <GeoJSON key={`louisiana-${active}`} data={louisianaGeoJson}
              style={{ color: '#34d399', fillColor: '#34d399', fillOpacity: active ? 0.07 : 0.03, weight: active ? 0.6 : 0, opacity: active ? 0.3 : 0 }}
              onEachFeature={(f, l) => l.bindTooltip(
                `<div class="tooltip-name">Louisiana Purchase</div><div class="tooltip-sub">${f.properties.name} · Acquired from France 1803</div>`,
                { sticky: true, className: 'leaflet-tooltip' }
              )}
            />
          })()}

          {/* Indian Removal */}
          {year >= 1830 && year <= 1842 && indianRemovalGeoJson && (() => {
            const active = Math.abs(year - 1830) <= 10
            return <GeoJSON key={`indian-removal-${active}`} data={indianRemovalGeoJson}
              style={{ color: '#f87171', fillColor: '#f87171', fillOpacity: active ? 0.1 : 0.04, weight: active ? 0.6 : 0, opacity: active ? 0.3 : 0 }}
              onEachFeature={(f, l) => l.bindTooltip(
                `<div class="tooltip-name">Indian Removal Act</div><div class="tooltip-sub">${f.properties.name} · Tribal lands cleared 1830–1842</div>`,
                { sticky: true, className: 'leaflet-tooltip' }
              )}
            />
          })()}

          {/* 13 Colonies */}
          {year >= 1776 && coloniesGeoJson && (() => {
            const active = Math.abs(year - 1776) <= 20
            return <GeoJSON key={`colonies-${active}`} data={coloniesGeoJson}
              style={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: active ? 0.07 : 0.03, weight: active ? 0.8 : 0, opacity: active ? 0.45 : 0 }}
              onEachFeature={(f, l) => l.bindTooltip(
                `<div class="tooltip-name">${f.properties.name}</div><div class="tooltip-sub">Original colony · 1776</div>`,
                { sticky: true, className: 'leaflet-tooltip' }
              )}
            />
          })()}

          {/* Event overlays */}
          {activeOverlays.map(o => {
            if (o.type === 'region') {
              return (
                <Polygon
                  key={o.id}
                  positions={o.positions}
                  pathOptions={{
                    color: o.color, fillColor: o.color,
                    fillOpacity: o.opacity, weight: 0.5,
                    opacity: 0.25, interactive: false,
                  }}
                />
              )
            }
            return (
              <Marker key={o.id} position={o.center} icon={OVERLAY_ICONS[o.type]}>
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="tooltip-name">{o.label}</div>
                  <div className="tooltip-sub">{o.sub}</div>
                </Tooltip>
              </Marker>
            )
          })}

          {/* Steamboat rivers */}
          {Math.abs(year - 1807) <= 20 && riversGeoJson && (() => {
            const notes = Object.fromEntries(STEAMBOAT_RIVERS.map(r => [r.name, r.note]))
            return (
              <GeoJSON
                key="steamboat-rivers"
                data={riversGeoJson}
                style={{ color: '#7dd3fc', weight: 2, opacity: 0.65 }}
                onEachFeature={(f, l) => {
                  const note = notes[f.properties.name] || ''
                  l.bindTooltip(
                    `<div class="tooltip-name">${f.properties.name}</div><div class="tooltip-sub">${note}</div>`,
                    { sticky: true, className: 'leaflet-tooltip' }
                  )
                }}
              />
            )
          })()}

          {/* Lewis & Clark Expedition */}
          {EXPEDITIONS.filter(e => year >= e.yearFrom && year <= e.yearTo).flatMap(e => {
            const isOutbound = e.id === 'lewis-clark-outbound'
            const greyed = isOutbound && year >= 1806
            const color = greyed ? '#3a3a3a' : '#4ade80'
            const opacity = greyed ? 0.35 : 0.9
            return [
              <Polyline
                key={`${e.id}-base`}
                positions={e.positions}
                pathOptions={{ color, weight: 1.5, opacity, dashArray: '2 5', interactive: false }}
              />,
              <Polyline
                key={`${e.id}-hit`}
                positions={e.positions}
                pathOptions={{ color, weight: 20, opacity: 0 }}
              >
                <Tooltip sticky>
                  <div className="tooltip-name">{e.name}</div>
                  <div className="tooltip-sub">{e.note}</div>
                </Tooltip>
              </Polyline>,
            ]
          })}

          {/* Railroad lines */}
          {RAILROADS.filter(r => year >= r.year).flatMap(r => [
            <Polyline
              key={`${r.id}-base`}
              positions={r.positions}
              pathOptions={{ color: '#a89bc2', weight: 4, opacity: 0.55, interactive: false }}
            />,
            <Polyline
              key={`${r.id}-ties`}
              positions={r.positions}
              pathOptions={{ color: '#0a0a0a', weight: 4, opacity: 1, dashArray: '4 8', interactive: false }}
            />,
            <Polyline
              key={`${r.id}-hit`}
              positions={r.positions}
              pathOptions={{ color: '#a89bc2', weight: 20, opacity: 0 }}
            >
              <Tooltip sticky>
                <div className="tooltip-name">{r.name}</div>
                <div className="tooltip-sub">completed {r.year}</div>
              </Tooltip>
            </Polyline>,
          ])}

          {/* Highway lines */}
          {HIGHWAYS.filter(h => year >= h.year).map(h => (
            <Polyline
              key={h.id}
              positions={h.positions}
              pathOptions={{
                color: '#facc15',
                weight: 1.5,
                opacity: 0.5,
                dashArray: '6 4',
              }}
            >
              <Tooltip sticky>
                <div className="tooltip-name">{h.name}</div>
                <div className="tooltip-sub">{h.note} · opened {h.year}</div>
              </Tooltip>
            </Polyline>
          ))}

          {/* Migration arcs */}
          {deceased.map(p => {
            if (!p.birth.place || !p.death.place) return null
            const bp = PLACES[p.birth.place]
            const dp = PLACES[p.death.place]
            if (!bp || !dp || sameCoords(bp, dp)) return null
            return (
              <Polyline
                key={`arc-${p.id}`}
                positions={[[bp.lat, bp.lng], [dp.lat, dp.lng]]}
                pathOptions={{
                  color: p.isMainLine ? '#f59e0b' : '#475569',
                  weight: p.isMainLine ? 1.5 : 1,
                  opacity: p.id === selectedId ? 0.9 : 0.35,
                  dashArray: '5 5',
                }}
                eventHandlers={{ click: () => handleSelect(p.id) }}
              />
            )
          })}

          {/* Birth markers */}
          {visible.map(p => {
            if (!p.birth.place) return null
            const bp = PLACES[p.birth.place]
            if (!bp) return null
            const isAlive = !p.death.year || p.death.year > year
            const isSelected = p.id === selectedId
            return (
              <CircleMarker
                key={`birth-${p.id}`}
                center={[bp.lat, bp.lng]}
                radius={isSelected ? 7 : isAlive ? 5 : 4}
                pathOptions={{
                  fillColor: '#22c55e',
                  color: isSelected ? '#fff' : '#15803d',
                  weight: isSelected ? 2 : 1,
                  fillOpacity: isAlive ? 0.85 : 0.4,
                }}
                eventHandlers={{ click: () => handleSelect(p.id) }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  <div className="tooltip-name">{p.name}</div>
                  <div className="tooltip-sub">b. {p.birth.year} · {bp.label}</div>
                </Tooltip>
              </CircleMarker>
            )
          })}

          {/* Death markers */}
          {deceased.map(p => {
            if (!p.death.place) return null
            const dp = PLACES[p.death.place]
            if (!dp) return null
            const bp = p.birth.place ? PLACES[p.birth.place] : null
            if (sameCoords(bp, dp)) return null
            const isSelected = p.id === selectedId
            return (
              <CircleMarker
                key={`death-${p.id}`}
                center={[dp.lat, dp.lng]}
                radius={isSelected ? 6 : 4}
                pathOptions={{
                  fillColor: '#ef4444',
                  color: isSelected ? '#fff' : '#b91c1c',
                  weight: isSelected ? 2 : 1,
                  fillOpacity: 0.75,
                }}
                eventHandlers={{ click: () => handleSelect(p.id) }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  <div className="tooltip-name">{p.name}</div>
                  <div className="tooltip-sub">d. {p.death.year} · {dp.label}</div>
                </Tooltip>
              </CircleMarker>
            )
          })}
        </MapContainer>}

        {/* Legend + detail — map mode only */}
        {viewMode === 'map' && <>

        {/* Legend */}
        <div className="map-legend">
          <div className="legend-row"><div className="legend-dot" style={{ background: '#22c55e' }} /> Birth location</div>
          <div className="legend-row"><div className="legend-dot" style={{ background: '#ef4444' }} /> Death location</div>
          <div className="legend-row"><div className="legend-line" /> Main Coy line</div>
          <div className="legend-row"><div className="legend-line branch" /> Branch / spouse</div>
          <div className="legend-row"><div className="legend-line railroad" /> Railroad</div>
          <div className="legend-row"><div className="legend-line highway" /> National Road</div>
          {year >= 1804 && year <= 1806 && <div className="legend-row"><div className="legend-line expedition" /> Lewis &amp; Clark</div>}
          {year >= 1776 && <div className="legend-row"><div className="legend-dot" style={{ background: '#fbbf24', opacity: 0.6 }} /> 13 Colonies</div>}
          {year >= 1787 && <div className="legend-row"><div className="legend-dot" style={{ background: '#60a5fa', opacity: 0.6 }} /> Northwest Territory</div>}
          {year >= 1803 && <div className="legend-row"><div className="legend-dot" style={{ background: '#34d399', opacity: 0.6 }} /> Louisiana Purchase</div>}
          {year >= 1830 && year <= 1842 && <div className="legend-row"><div className="legend-dot" style={{ background: '#f87171', opacity: 0.6 }} /> Indian Removal</div>}
          {activeOverlays.some(o => o.id?.startsWith('invention-')) && <div className="legend-row"><div className="legend-dot" style={{ background: '#eab308', opacity: 0.7 }} /> Invention</div>}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="detail-panel">
            <button className="detail-close" onClick={() => setSelectedId(null)}>✕</button>
            <div className={`detail-name ${selected.isMainLine ? 'main-line' : ''}`}>
              {selected.name}
            </div>
            <div className="detail-years">
              {formatYears(selected)} · Gen {selected.generation}
            </div>
            {selected.tags.length > 0 && (
              <div className="person-tags" style={{ marginTop: 6 }}>
                {selected.tags.map(t => <span key={t} className={`tag ${t}`}>{t}</span>)}
              </div>
            )}
            <hr className="detail-divider" />
            <div className="detail-row">
              <span className="detail-label">Born</span>
              <span className="detail-val green">
                {selected.birth.year ?? '?'} · {selected.birth.place ? PLACES[selected.birth.place]?.label : 'Unknown'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Died</span>
              <span className="detail-val red">
                {selected.death.year ?? '?'} · {selected.death.place ? PLACES[selected.death.place]?.label : 'Unknown'}
              </span>
            </div>
            {selected.spouseId && (() => {
              const spouse = people.find(p => p.id === selected.spouseId)
              return spouse ? (
                <div className="detail-row">
                  <span className="detail-label">Spouse</span>
                  <span
                    className="detail-val"
                    style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#333' }}
                    onClick={() => setSelectedId(spouse.id)}
                  >
                    {spouse.name}
                  </span>
                </div>
              ) : null
            })()}
            {selected.notes && <div className="detail-notes">{selected.notes}</div>}
          </div>
        )}
        </>}
      </div>

      {/* Timeline */}
      <footer className="timeline">
        <span className="timeline-label">{MIN_YEAR}</span>
        <div className="slider-wrap">
          <input
            type="range"
            className="timeline-slider"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={year}
            onChange={handleSlider}
          />
          {EVENT_GROUPS.flatMap(g => {
            const pct = (g.year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)
            const isNearest = g.year === nearestYear
            const left = `calc(9px + ${pct} * (100% - 18px))`
            const ticks = [
              <div
                key={`tick-${g.year}`}
                className={`timeline-tick${isNearest ? ' active' : ''}`}
                style={{ left }}
              >
                {isNearest && (
                  <div className="tick-label-wrap">
                    <div className="tick-label">{g.events[0].label}</div>
                    <div className="tick-tooltip">
                      {g.events.length > 1
                        ? g.events.map((e, i) => (
                            <span key={e.label} style={{ display: 'block' }}>
                              {i > 0 && <span style={{ display: 'block', borderTop: '1px solid #2a2a2a', margin: '5px 0' }} />}
                              <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{e.label}:&nbsp;</span>
                              {e.desc}
                            </span>
                          ))
                        : g.events[0].desc}
                    </div>
                  </div>
                )}
                <div className="tick-line" />
              </div>,
            ]
            if (isNearest && g.events.length > 1) {
              ticks.push(
                <div
                  key={`tick-flipped-${g.year}`}
                  className="timeline-tick active flipped"
                  style={{ left }}
                >
                  <div className="tick-label-wrap">
                    <div className="tick-label">{g.events[1].label}</div>
                  </div>
                  <div className="tick-line" />
                </div>
              )
            }
            return ticks
          })}
        </div>
        <span className="timeline-label right">{MAX_YEAR}</span>
        <div className="timeline-year-big">{year}</div>
      </footer>
    </div>
  )
}
