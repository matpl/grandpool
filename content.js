function getPlayerName(player) {
    player = player.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove accents
    const splits = player.split(" ");
    if(splits[0].length > 2) {
        splits[0] = splits[0].substring(0, 3);
    }
    return splits.join(" ");
}

function getTeamName(city) {
    switch(city) {
        case "WSH":
            return "capitals";
        case "PIT":
            return "penguins";
        case "CHI":
            return "blackhawks";
        case "FLA":
            return "panthers";
        case "CBJ":
            return "blue jackets";
        case "DET":
            return "red wings";
        case "BOS":
            return "bruins";
        case "NYI":
            return "islanders";
        case "WPG":
            return "jets";
        case "TOR":
            return "maple leafs";
        case "BUF":
            return "sabres";
        case "PHI":
            return "flyers";
        case "SJS":
            return "sharks";
        case "STL":
            return "blues";
        case "CAR":
            return "hurricanes";
        case "NSH":
            return "predators";
        case "MIN":
            return "wild";
        case "ANA":
            return "ducks";
        case "VAN":
            return "canucks";
        case "CGY":
            return "flames";
        case "MTL":
            return "canadiens";
        case "EDM":
            return "oilers";
        case "ARI":
            return "coyotes";
        case "VGK":
            return "golden knights";
        case "NJD":
            return "devils";
        case "NYR":
            return "rangers";
        case "COL":
            return "avalanche";
        case "LAK":
            return "kings";
        case "OTT":
            return "senators";
        case "DAL":
            return "stars";
        case "TBL":
            return "lightning";
    }
    return undefined;
}

pointers = {}

fetch("https://nhl-score-api.herokuapp.com/api/scores/latest").then(d => d.json()).then(j => {
    for(let k = 0; k < j.games.length; k++) {
        for(let g = 0; g < j.games[k].goals.length; g++) {
            if(j.games[k].goals[g].scorer && j.games[k].goals[g].scorer.player) {
                let name = getPlayerName(j.games[k].goals[g].scorer.player.toLowerCase());
                if (!(name in pointers)) {
                    pointers[name] = 0;
                }
                pointers[name] += 1;
            }
            if (j.games[k].goals[g].assists) {
                for(let a = 0; a < j.games[k].goals[g].assists.length; a++) {
                    let name = getPlayerName(j.games[k].goals[g].assists[a].player.toLowerCase());
                    if (!(name in pointers)) {
                        pointers[name] = 0;
                    }
                    pointers[name] += 1;
                }
            }
        }

        if (j.games[k].status.state === "FINAL") {
            // check team points
            const entries = Object.entries(j.games[k].currentStats.streaks);
            for(let t = 0; t < 2; t++) {
                let team = getTeamName(entries[t][0]);
                if (!(team in pointers)) {
                    pointers[team] = 0;
                }
                if (entries[t][1].type === "WINS") {
                    pointers[team] += 2;
                } else if (entries[t][1].type === "OT") {
                    pointers[team] += 1;
                }
            }
        }
    }

    if(document.location.href.includes("groupe")) {
        const poolers = document.querySelectorAll(".pooler-row div div a");
        for(let i = 0; i < poolers.length; i++) {
            // fetch the page and the players
            fetch(poolers[i].href).then(d => d.text()).then(t => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(t, "text/html");
                const names = doc.querySelectorAll(".name");
                // 0 is the name of the pooler
                var points = 0;
                for(let j = 1; j < names.length; j++) {
                    names[j].removeChild(names[j].children[0]);
                    const player = getPlayerName(names[j].innerText.replace("\u00A0", "").toLowerCase().trim());
                    if (j < names.length - 7) {
                        if (player in pointers) {
                            points += pointers[player];
                        }
                    } else if (j < names.length - 3) {
                        // goalies
                    } else {
                        // teams
                        if (player in pointers) {
                            points += pointers[player];
                        }
                    }
                }
    
                for(let j = 0; j < poolers.length; j++) {
                    if (poolers[j].children[0].innerText.toLowerCase().includes(names[0].innerText.toLowerCase().trim())) {
                        poolers[j].children[1].children[0].children[2].innerHTML += " <span style='color:green;'>(+" + points + ")</span>";
                    }
                }
            });
        }
    } else {
        const players = document.querySelectorAll(".player-row div div a div.name");
        for(let j = 0; j < players.length; j++) {
            const player = getPlayerName(players[j].innerText.split('\n')[0].replace("\u00A0", "").toLowerCase().trim());
            if (player in pointers && pointers[player] > 0) {
                players[j].innerHTML = players[j].innerHTML.substring(0, players[j].innerHTML.indexOf('<')) + "<span style='color:green;'>&nbsp;(+" + pointers[player] + ")</span>" + players[j].innerHTML.substring(players[j].innerHTML.indexOf('<'));
            }
        }
    }
});