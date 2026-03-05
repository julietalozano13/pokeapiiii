const container = document.getElementById("pokemonContainer");

let pokemons = [];

// Obtener pokemones desde la API
async function getPokemons(){

    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
    const data = await response.json();

    const results = data.results;

    for(let pokemon of results){

        const res = await fetch(pokemon.url);
        const pokeData = await res.json();

        pokemons.push(pokeData);
    }

    displayPokemons(pokemons);
}

getPokemons();


// Mostrar pokemones en tarjetas
function displayPokemons(pokemonList){

    container.innerHTML = "";

    pokemonList.forEach(pokemon => {

        const card = document.createElement("div");
        card.classList.add("card");

        const types = pokemon.types
            .map(t => t.type.name)
            .join(", ");

        const abilities = pokemon.abilities
            .map(a => a.ability.name)
            .join(", ");

        const hp = pokemon.stats.find(stat => stat.stat.name === "hp").base_stat;
        const attack = pokemon.stats.find(stat => stat.stat.name === "attack").base_stat;
        const defense = pokemon.stats.find(stat => stat.stat.name === "defense").base_stat;
        const speed = pokemon.stats.find(stat => stat.stat.name === "speed").base_stat;

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
        `;

        container.appendChild(card);
    });

}


// Eventos para los filtros
document.getElementById("searchName").addEventListener("input", filterPokemon);
document.getElementById("searchId").addEventListener("input", filterPokemon);
document.getElementById("searchType").addEventListener("input", filterPokemon);


// Función de filtrado
function filterPokemon(){

    const name = document.getElementById("searchName").value.toLowerCase();
    const id = document.getElementById("searchId").value;
    const type = document.getElementById("searchType").value.toLowerCase();

    const filtered = pokemons.filter(pokemon => {

        const matchName = pokemon.name.includes(name);

        const matchId = id === "" || pokemon.id == id;

        const matchType = pokemon.types.some(t =>
            t.type.name.includes(type)
        );

        return matchName && matchId && matchType;

    });

    displayPokemons(filtered);
}