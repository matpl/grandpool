const poolers = document.querySelectorAll(".pooler-row div div a");

pointers = {}

fetch("https://nhl-score-api.herokuapp.com/api/scores/latest").then(d => d.json()).then(j => {
    for(let k = 0; k < j.games.length; k++) {
        for(let g = 0; g < j.games[k].goals.length; g++) {
            let name = j.games[k].goals[g].scorer.player.toLowerCase();
            if (!(name in pointers)) {
                pointers[name] = 0;
            }
            pointers[name] += 1;
            for(let a = 0; a < j.games[k].goals[g].assists.length; a++) {
                let name = j.games[k].goals[g].assists[a].player.toLowerCase();
                if (!(name in pointers)) {
                    pointers[name] = 0;
                }
                pointers[name] += 1;
            }
        }
    }

    for(let i = 0; i < poolers.length; i++) {
        // fetch the page and the players
        fetch(poolers[i].href).then(d => d.text()).then(t => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(t, "text/html");
            const names = doc.querySelectorAll(".name");
            // 0 is the name of the pooler
            var points = 0;
            for(let j = 1; j < names.length - 7; j++) { // minus 7 because the last 7 are for goalies and teams
                names[j].removeChild(names[j].children[0]);
                const player = names[j].innerText.replace("\u00A0", "").toLowerCase().trim();
                if (player in pointers) {
                    points += pointers[player];
                }
            }

            for(let j = 0; j < poolers.length; j++) {
                if (poolers[j].children[0].innerText.toLowerCase().includes(names[0].innerText.toLowerCase().trim())) {
                    poolers[j].children[1].children[0].children[2].innerHTML += " <span style='color:green;'>(+" + points + ")</span>";
                }
            }

            console.log("should add " + points + " to " + names[0].innerText.trim());
        });
    }
});