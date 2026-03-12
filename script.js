// contenedor donde se renderizan los pokemon
const container = document.getElementById("pokemonContainer")

// imagen placeholder
const placeholder = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"

// lista completa de pokemon
let allRefs = []

// lista filtrada
let filteredRefs = []

// cache de detalles
const detailsCache = new Map()

// paginación
let pageSize = 30
let cursor = 0
let isLoading = false

// pokemon seleccionados
let fighter1 = null
let fighter2 = null

// inputs filtros
const inputName = document.getElementById("searchName")
const inputId = document.getElementById("searchId")
const inputType = document.getElementById("searchType")

// log batalla
const log = document.getElementById("battleLog")



/* cargar lista completa de pokemon */

async function fetchAllPokemonRefs(){

let url = "https://pokeapi.co/api/v2/pokemon?limit=200&offset=0"

while(url){

const res = await fetch(url)
const data = await res.json()

allRefs = allRefs.concat(data.results)

url = data.next

}

filteredRefs = allRefs

await resetAndLoad()

}

fetchAllPokemonRefs()



/* obtener detalles pokemon */

async function getPokemonDetails(ref){

if(detailsCache.has(ref.url)) return detailsCache.get(ref.url)

const res = await fetch(ref.url)
const data = await res.json()

detailsCache.set(ref.url,data)

return data

}



/* crear tarjeta pokemon */

function createCard(pokemon){

const card = document.createElement("div")
card.classList.add("card")

const types = pokemon.types.map(t => t.type.name).join(", ")
const abilities = pokemon.abilities.map(a => a.ability.name).join(", ")

const hp = pokemon.stats.find(s => s.stat.name === "hp")?.base_stat ?? "N/A"
const attack = pokemon.stats.find(s => s.stat.name === "attack")?.base_stat ?? "N/A"
const defense = pokemon.stats.find(s => s.stat.name === "defense")?.base_stat ?? "N/A"
const speed = pokemon.stats.find(s => s.stat.name === "speed")?.base_stat ?? "N/A"

card.innerHTML = `
<h3>${pokemon.name}</h3>
<img src="${pokemon.sprites.front_default}">
<p><strong>ID:</strong> ${pokemon.id}</p>
<p><strong>Tipo:</strong> ${types}</p>
<p><strong>Altura:</strong> ${pokemon.height}</p>
<p><strong>Peso:</strong> ${pokemon.weight}</p>
<p><strong>Habilidades:</strong> ${abilities}</p>
<p><strong>HP:</strong> ${hp}</p>
<p><strong>Ataque:</strong> ${attack}</p>
<p><strong>Defensa:</strong> ${defense}</p>
<p><strong>Velocidad:</strong> ${speed}</p>
`

card.addEventListener("click", () => selectPokemonForBattle(pokemon))

return card

}



/* cargar página siguiente */

async function loadNextPage(){

if(isLoading) return
if(cursor >= filteredRefs.length) return

isLoading = true

const slice = filteredRefs.slice(cursor,cursor+pageSize)
cursor += slice.length

for(let ref of slice){

const pokemon = await getPokemonDetails(ref)
container.appendChild(createCard(pokemon))

}

isLoading = false

}



/* scroll infinito */

function nearBottom(){

const threshold = 600
return window.innerHeight + window.scrollY >= document.body.offsetHeight - threshold

}

window.addEventListener("scroll",()=>{
if(nearBottom()) loadNextPage()
})



/* filtros */

function handleEnter(event){

if(event.key==="Enter") applyFilters()

}

inputName.addEventListener("keypress",handleEnter)
inputId.addEventListener("keypress",handleEnter)
inputType.addEventListener("keypress",handleEnter)



async function applyFilters(){

const name = inputName.value.trim().toLowerCase()
const id = inputId.value.trim()
const type = inputType.value.trim().toLowerCase()

let refs = allRefs.filter(ref=>{

const matchName = ref.name.includes(name)
const matchId = id==="" || ref.url.split("/").filter(Boolean).pop()==id

return matchName && matchId

})

if(type===""){

filteredRefs = refs
await resetAndLoad()
return

}

try{

const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`)
const data = await res.json()

const typeSet = new Set(data.pokemon.map(p=>p.pokemon.name))
filteredRefs = refs.filter(ref=>typeSet.has(ref.name))

}
catch{

filteredRefs = []

}

await resetAndLoad()

}


/* reset lista */

async function resetAndLoad(){

cursor = 0
container.innerHTML = ""

await loadNextPage()

}



/* seleccionar pokemon batalla */

function selectPokemonForBattle(pokemon){

if(!fighter1){

fighter1 = pokemon
document.getElementById("fighter1Img").src = pokemon.sprites.front_default
document.getElementById("fighter1Name").innerText = pokemon.name
return

}

if(!fighter2){

fighter2 = pokemon
document.getElementById("fighter2Img").src = pokemon.sprites.front_default
document.getElementById("fighter2Name").innerText = pokemon.name

}

}



/* eliminar pokemon */

function clearFighter(slot){

if(slot===1){

fighter1 = null
document.getElementById("fighter1Img").src = placeholder
document.getElementById("fighter1Name").innerText = "Seleccionar pokemon"

}else{

fighter2 = null
document.getElementById("fighter2Img").src = placeholder
document.getElementById("fighter2Name").innerText = "Seleccionar pokemon"

}

}



/* actualizar barras vida */

function updateHPBars(hp1,hp2){

document.getElementById("hpBar1").style.width = hp1 + "%"
document.getElementById("hpBar2").style.width = hp2 + "%"

}



/* cargar TODOS los moves y clasificarlos */

async function loadAllMoves(pokemon){

const normalMoves = []
const specialMoves = []
const defenseMoves = []

const promises = pokemon.moves.map(m => fetch(m.move.url).then(r=>r.json()))
const allMoves = await Promise.all(promises)

for(const moveData of allMoves){

const name = moveData.name
const type = moveData.damage_class.name

if(type==="physical") normalMoves.push(name)
if(type==="special") specialMoves.push(name)
if(type==="status") defenseMoves.push(name)

}

return {normal:normalMoves,special:specialMoves,defense:defenseMoves}

}

/* batalla */

async function startBattle(){

if(!fighter1 || !fighter2){
alert("Selecciona dos Pokémon")
return
}

log.style.display="block"
log.innerHTML=""

updateHPBars(100,100)

const p1Moves = await loadAllMoves(fighter1)
const p2Moves = await loadAllMoves(fighter2)

let p1 = {hp:100,moves:p1Moves,name:fighter1.name}
let p2 = {hp:100,moves:p2Moves,name:fighter2.name}

let turn = 1
let isP1Turn = true

while(turn<=6 && p1.hp>0 && p2.hp>0){

let attacker = isP1Turn ? p1 : p2
let defender = isP1Turn ? p2 : p1

let action
let moveName
let damage = 0
let heal = 0

let r = Math.random()

if(turn>2 && attacker.moves.defense.length>0 && r < 0.2){

action = "defensa"
moveName = attacker.moves.defense[Math.floor(Math.random()*attacker.moves.defense.length)]
heal = Math.floor(Math.random()*15)+5

}
else if(turn>3 && attacker.moves.special.length>0 && r < 0.4){

action = "especial"
moveName = attacker.moves.special[Math.floor(Math.random()*attacker.moves.special.length)]
damage = Math.floor(Math.random()*30)+15

}
else if(r < 0.2){

action = "fallo"
moveName = "ataque"

}
else{

action = "normal"
moveName = attacker.moves.normal[Math.floor(Math.random()*attacker.moves.normal.length)]
damage = Math.floor(Math.random()*20)+5

}

if(action === "defensa"){

attacker.hp += heal
if(attacker.hp>100) attacker.hp=100

updateHPBars(p1.hp,p2.hp)

log.innerHTML += `<p>Turno ${turn}: <strong>${attacker.name}</strong> usó <strong>${moveName}</strong> (defensa especial) y recuperó <strong>${heal}</strong> de vida.</p>`

}
else if(action === "fallo"){

log.innerHTML += `<p>Turno ${turn}: <strong>${attacker.name}</strong> intentó atacar pero falló.</p>`

}
else{

defender.hp -= damage
if(defender.hp<0) defender.hp=0

updateHPBars(p1.hp,p2.hp)

log.innerHTML += `<p>Turno ${turn}: <strong>${attacker.name}</strong> usó <strong>${moveName}</strong> (${action==="especial"?"ataque especial":"ataque normal"}) e hizo <strong>${damage}</strong> de daño.</p>`

}

isP1Turn = !isP1Turn
turn++

await new Promise(r=>setTimeout(r,1000))

}

let winner = p1.hp>p2.hp ? fighter1 : fighter2

showWinnerAnimation(winner)

}

/* pantalla ganador */

function showWinnerAnimation(winner){

const overlay=document.createElement("div")
overlay.classList.add("winner-overlay")

overlay.innerHTML=`
<div class="winner-display">
<h2>🏆 GANADOR</h2>
<img src="${winner.sprites.front_default}">
</div>
`

document.body.appendChild(overlay)

setTimeout(()=>{
overlay.remove()
resetBattle()
},2000)

}



/* reset batalla */

function resetBattle(){

fighter1=null
fighter2=null

document.getElementById("fighter1Img").src=placeholder
document.getElementById("fighter2Img").src=placeholder

document.getElementById("fighter1Name").innerText="Seleccionar pokemon"
document.getElementById("fighter2Name").innerText="Seleccionar pokemon"

updateHPBars(100,100)

log.style.display="none"
log.innerHTML=""

}