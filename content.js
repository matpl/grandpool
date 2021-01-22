
function getPlayerName(player, shorten = true) {
    player = player.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove accents
    if(shorten) {
        const splits = player.split(" ");
        if(splits[0].length > 2) {
            splits[0] = splits[0].substring(0, 3);
        }
        player = splits.join(" ");
    }
    return player;
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

goalies = {}

function getGoalies(teamName) {
    return Object.entries(goalies).filter(g => g[1].includes(teamName)).map(g => g[0]);
}

pointers = {}

// find goalies
fetch("https://statsapi.web.nhl.com/api/v1/schedule").then(s => s.json()).then(d => { 
    if(d.dates[0].games.filter(g => g.status.abstractGameState === "Preview").length !== d.dates[0].games.length) { // at least one game has started
        Promise.all(d.dates[0].games.map(g => fetch(`https://statsapi.web.nhl.com/api/v1/game/${g.gamePk}/boxscore`))).then(r => Promise.all(r.map(p => p.json())))
        .then(games => {
            games.forEach(g => {
                const isGoalie = p => p[1].stats.goalieStats && p[1].stats.goalieStats.timeOnIce !== "0:00";
                [...Object.entries(g.teams.away.players).filter(isGoalie).map(g => g[1]), ...Object.entries(g.teams.home.players).filter(isGoalie).map(g => g[1])].forEach(g => {
                    goalies[getPlayerName(g.person.fullName)] = g.person.currentTeam.name.toLowerCase();
                });
            });
            Object.entries(goalies).forEach(g => pointers[g[0]] = 0);
    
            fetch("https://nhl-score-api.herokuapp.com/api/scores/latest").then(d => d.json()).then(j => {
                for(let k = 0; k < j.games.length; k++) {
                    for(let g = 0; g < j.games[k].goals.length; g++) {
                        if(j.games[k].goals[g].scorer && j.games[k].goals[g].scorer.player) {
                            let name = getPlayerName(j.games[k].goals[g].scorer.player);
                            if (!(name in pointers)) {
                                pointers[name] = 0;
                            }
                            pointers[name] += 1;
                        }
                        if (j.games[k].goals[g].assists) {
                            for(let a = 0; a < j.games[k].goals[g].assists.length; a++) {
                                let name = getPlayerName(j.games[k].goals[g].assists[a].player);
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
                                getGoalies(team).forEach(g => {
                                    pointers[g] += 2;
                                    // if shutout, add 1 point
                                    if(j.games[k].scores[entries[(t + 1) % 2][0]] === 0) {
                                        pointers[g] += 1;
                                    }
                                });
    
                                pointers[team] += 2;
                            } else if (entries[t][1].type === "OT") {
                                getGoalies(team).forEach(g => pointers[g] += 1);
                                pointers[team] += 1;
                            }
                        }
                    }
                }
    
                if(document.location.href.includes("groupe") || document.location.href.includes("classement") || document.location.href.includes("poolers")) {
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
                                const player = getPlayerName(names[j].innerText.replace("\u00A0", "").trim(), j >= players.length - 3 /* team */ ? false : true);
                                if (player in pointers) {
                                    points += pointers[player];
                                }
                            }
                
                            poolers[i].children[1].children[0].children[2].innerHTML += " <span style='color:green;'>(+" + points + ")</span>";
                        });
                    }
                } else {
                    let total = 0;
                    const players = document.querySelectorAll(".player-row:not(.exchanged) div div a div.name");
                    for(let j = 0; j < players.length; j++) {
                        const player = getPlayerName(players[j].innerText.split('\n')[0].replace("\u00A0", "").trim(), j >= players.length - 3 /* team */ ? false : true);
                        if (player in pointers && pointers[player] > 0) {
                            total += pointers[player];
                            players[j].innerHTML = players[j].innerHTML.substring(0, players[j].innerHTML.indexOf('<')) + "<span style='color:green;'>&nbsp;(+" + pointers[player] + ")</span>" + players[j].innerHTML.substring(players[j].innerHTML.indexOf('<'));
                        }
                    }
                    document.querySelector(".myProfile-header .row div:last-child div:last-child .highlight").innerHTML += "<span style='color:green;'> (+" + total + ")</span>";
                }
            });
        });
    }
});