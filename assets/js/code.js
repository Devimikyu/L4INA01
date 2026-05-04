// Variables globales
let tokens = [];
// attend que la page soit entièrement chargée avant d'exécuter le code
window.onload = function() {
        // Récupération des éléments HTML par leur identifiant
    let fileInput = document.getElementById('fileInput');
    let fileDisplayArea = document.getElementById('fileDisplayArea');
    // Écoute l'événement "changement de fichier" sur l'input
    fileInput.addEventListener('change', function(e) {
        let file = fileInput.files[0];
    // Vérifie que le fichier est bien de type texte via une regex
        let textType = new RegExp("text.*");
        if (file.type.match(textType)) {
            // FileReader permet de lire le contenu d'un fichier local
            var reader = new FileReader();
            reader.onload = function(e) {
                // Affiche le contenu brut dans la zone gauche
                fileDisplayArea.innerText = reader.result;
                 // Appel automatique de la segmentation dès le chargement
                tokens = segmentation();
                document.getElementById("logger").innerHTML ='<span class="infolog">Fichier chargé avec succès — ' + tokens.length + ' token(s)</span>';
            }
            reader.readAsText(file);
        } else {
            fileDisplayArea.innerText = "";
            tokens = [];
             // Affiche un message de succès avec le nombre de tokens
            document.getElementById("logger").innerHTML =
                '<span class="errorlog">Type de fichier non supporté !</span>';
        }
    });
}
// Permet de relancer la segmentation manuellement via le bouton
function lancerSegmentation() {
      // Vérifie qu'un fichier a bien été chargé avant de segmenter
    if (document.getElementById('fileDisplayArea').innerText.trim() === "") {
        document.getElementById("logger").innerHTML =
            '<span class="errorlog">Chargez d\'abord un fichier !</span>';
        return;
    }
    tokens = segmentation();
    document.getElementById("logger").innerHTML =
        '<span class="infolog">Segmentation effectuée — ' + tokens.length + ' token(s)</span>';
}
// Découpe le texte en tokens selon les délimiteurs et la longueur minimale
function segmentation() {
    // Récupère le texte affiché et les paramètres saisis dans l'interface
    let texte = document.getElementById('fileDisplayArea').innerText;
    let delimiteurs = document.getElementById('delimID').value;
    let longueur = parseInt(document.getElementById('lgID').value) || 1;
    // Découpage caractère par caractère sur chaque délimiteur
    let result = [texte];
    for (let i = 0; i < delimiteurs.length; i++) {
        let newResult = [];
        for (let j = 0; j < result.length; j++) {
            // split() divise la chaîne à chaque occurrence du délimiteur
            let parts = result[j].split(delimiteurs[i]);
            newResult = newResult.concat(parts);
        }
        result = newResult;
    }
    // Filtre sur la longueur minimale et supprime les vides
    tokens = result.filter(function(tok) {
        return tok.trim().length >= longueur;
    }).map(function(tok) {
        return tok.trim();
    });
    return tokens;
}
// Affiche ou masque la section d'aide selon son état actuel
function toggleAide() {
    let aide = document.getElementById("aide");
    if (aide.style.display === "none") {
        aide.style.display = "block";
    } else {
        aide.style.display = "none";
    }
}
// Construit et affiche un tableau des formes triées par fréquence décroissante
function dictionnaire() {
    console.log("Tokens au moment du dictionnaire :", tokens.length); 
    // Vérifie que des tokens sont disponibles
    if (tokens.length === 0) {
        document.getElementById("page-analysis").innerHTML =
            "<p>Aucun token disponible. Chargez d'abord un fichier.</p>";
        return;
    }
     // Compte le nombre d'occurrences de chaque forme en minuscule
    let compte = {};
    for (let i = 0; i < tokens.length; i++) {
        let forme = tokens[i].toLowerCase();
        if (compte[forme] === undefined) {
            compte[forme] = 0;
        }
        compte[forme]++;
    }
// Convertit l'objet en tableau de paires [forme, fréquence] puis trie par fréquence décroissante
    let entrees = Object.entries(compte);
    entrees.sort(function(a, b) { return b[1] - a[1]; });
// Construit le tableau HTML ligne par ligne
    let html = "<table border='1' style='width:100%; font-size:0.8em; border-collapse:collapse;'>";
    html += "<tr><th>Forme</th><th>Fréquence</th></tr>";
    for (let i = 0; i < entrees.length; i++) {
        html += "<tr><td>" + entrees[i][0] + "</td><td>" + entrees[i][1] + "</td></tr>";
    }
    html += "</table>";
     // Injecte le tableau dans la zone de résultat
    document.getElementById("page-analysis").innerHTML = html;
}
// Recherche le pôle dans les tokens et affiche le contexte gauche/droit
function grep() {
    // Vérifie qu'un pôle a été saisi
    let pole = document.getElementById('poleID').value.trim();
    if (pole === "") {
        document.getElementById("page-analysis").innerHTML =
            '<p>Entrez un pôle dans le champ "Pôle".</p>';
        return;
    }
    // Vérifie que des tokens sont disponibles
    if (tokens.length === 0) {
        document.getElementById("page-analysis").innerHTML =
            '<p>Aucun token disponible. Chargez d\'abord un fichier.</p>';
        return;
    }
    // Parcourt tous les tokens et cherche les occurrences du pôle
    let resultats = [];
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].toLowerCase() === pole.toLowerCase()) {
            let gauche = tokens.slice(Math.max(0, i - 3), i).join(' ');
            let droite = tokens.slice(i + 1, Math.min(tokens.length, i + 4)).join(' ');
            resultats.push({ gauche, pole: tokens[i], droite });
        }
    }
    if (resultats.length === 0) {
        document.getElementById("page-analysis").innerHTML =
            '<p>Aucune occurrence de "' + pole + '" trouvée.</p>';
        return;
    }
 // Construit le tableau HTML avec contexte gauche, pôle, contexte droit
    let html = "<table style='width:100%; font-size:0.8em; border-collapse:collapse;'>";
    html += "<tr><th>Gauche</th><th style='color:#ff85a1'>Pôle</th><th>Droite</th></tr>";
    for (let i = 0; i < resultats.length; i++) {
        html += "<tr>";
        html += "<td style='text-align:right; padding:4px; border-bottom:1px solid #ffb3c6;'>" + resultats[i].gauche + "</td>";
        html += "<td style='text-align:center; color:#ff4d79; font-weight:bold; padding:4px; border-bottom:1px solid #ffb3c6;'>" + resultats[i].pole + "</td>";
        html += "<td style='text-align:left; padding:4px; border-bottom:1px solid #ffb3c6;'>" + resultats[i].droite + "</td>";
        html += "</tr>";
    }
    html += "</table>";
    document.getElementById("page-analysis").innerHTML = html;
}
// Affiche chaque occurrence du pôle avec son contexte gauche et droit
function concordancier() {
    // Vérifie que des tokens sont disponibles
    if (tokens.length === 0) {
        document.getElementById("page-analysis").innerHTML =
            '<span class="errorlog">Aucun fichier chargé !</span>';
        return;
    }
  // Vérifie qu'un pôle a été saisi
    let pole = document.getElementById("poleID").value.trim();
    if (pole === "") {
        document.getElementById("page-analysis").innerHTML =
            '<span class="errorlog">Veuillez entrer un pôle !</span>';
        return;
    }
 // La longueur définit le nombre de tokens de contexte de chaque côté
    let taille = parseInt(document.getElementById("lgID").value) || 5;
     // Regex qui correspond exactement au mot (du début à la fin)
    let regex = new RegExp("^" + pole + "$", "gi");
    let resultats = [];
 // Parcourt tous les tokens pour trouver les occurrences du pôle
    tokens.forEach(function(tok, index) {
        if (regex.test(tok)) {
            // Contexte gauche
            let gauche = tokens.slice(Math.max(0, index - taille), index);
            // Contexte droit
            let droite = tokens.slice(index + 1, index + 1 + taille);
            resultats.push({
                gauche: gauche.join(" "),
                mot: tok,
                droite: droite.join(" ")
            });
        }
    });
    if (resultats.length === 0) {
        document.getElementById("page-analysis").innerHTML =
            '<span class="errorlog">Aucune occurrence de "' + pole + '" trouvée !</span>';
        return;
    }
    // Construit le tableau avec contexte gauche, mot central en rouge, contexte droit
    let html = "<table border='1' style='width:100%; font-size:0.8em; border-collapse:collapse;'>";
    html += "<tr><th>Contexte gauche</th><th>Mot</th><th>Contexte droit</th></tr>";
    resultats.forEach(function(r) {
        html += "<tr>";
        html += "<td style='text-align:right; color:#888;'>" + r.gauche + "</td>";
        html += "<td style='text-align:center; color:red; font-weight:bold;'>" + r.mot + "</td>";
        html += "<td style='text-align:left; color:#888;'>" + r.droite + "</td>";
        html += "</tr>";
    });
    html += "</table>";
    document.getElementById("page-analysis").innerHTML = html;
}
// Construit un graphe camembert des 10 mots les plus fréquents
function camembert() {
    // Vérification : tokens disponibles 
    if (tokens.length === 0) {
        document.getElementById("page-analysis").innerHTML =
            '<span class="errorlog">Aucun fichier chargé !</span>';
        return;
    }
    // Compter les occurrences de chaque forme
    let compte = {};
    for (let i = 0; i < tokens.length; i++) {
        let forme = tokens[i].toLowerCase();
        if (compte[forme] === undefined) {
            compte[forme] = 0;
        }
        compte[forme]++;
    }
    // Trier par fréquence décroissante et garder les 10 premiers
    let entrees = Object.entries(compte);
    entrees.sort(function(a, b) { return b[1] - a[1]; });
    let top = entrees.slice(0, 10);
    // Calculer le total
    let total = top.reduce(function(acc, e) { return acc + e[1]; }, 0);
    // Couleurs des parts
    let couleurs = [
        '#ff85a1', '#ff4d79', '#ffb3c6', '#c2185b',
        '#f48fb1', '#f06292', '#e91e63', '#ad1457',
        '#ff80ab', '#ff4081'
    ];
    // Construire la légende HTML
    let legende = "<table style='font-size:0.75em; margin-top:8px; width:100%; border-collapse:collapse;'>";
    legende += "<tr><th>Couleur</th><th>Mot</th><th>Fréquence</th><th>%</th></tr>";
    top.forEach(function(entree, i) {
        let pct = ((entree[1] / total) * 100).toFixed(1);
        legende += "<tr>";
        legende += "<td><span style='background:" + couleurs[i] + "; display:inline-block; width:14px; height:14px; border-radius:50%;'></span></td>";
        legende += "<td>" + entree[0] + "</td>";
        legende += "<td>" + entree[1] + "</td>";
        legende += "<td>" + pct + "%</td>";
        legende += "</tr>";
    });
    legende += "</table>";
    // Injecte le canvas et la légende 
    document.getElementById("page-analysis").innerHTML =
        "<canvas id='camembert-canvas' width='200' height='200'></canvas>" + legende;
    // Récupére le canvas apres le innerHTML
    let canvas = document.getElementById("camembert-canvas");
    let ctx = canvas.getContext("2d");
    // Dessine le camembert 
    let angleDebut = -Math.PI / 2;
    top.forEach(function(entree, i) {
        let anglePart = (entree[1] / total) * 2 * Math.PI;
        let angleFin  = angleDebut + anglePart;
        ctx.beginPath();
        ctx.moveTo(100, 100);
        ctx.arc(100, 100, 90, angleDebut, angleFin);
        ctx.closePath();
        ctx.fillStyle = couleurs[i % couleurs.length];
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        angleDebut = angleFin;
    });
}
 // À chaque mouvement de souris, calcule la distance entre le curseur et chaque lettre
function initTextPressure() {
    const h1 = document.querySelector('#titre-analyse');
    if (!h1) return;
    const text = h1.innerText;
    h1.innerHTML = text.split('').map((char) =>
        `<span style="display:inline-block; transition: font-weight 0.1s;">${char === ' ' ? '&nbsp;' : char}</span>`
    ).join('');
    const spans = h1.querySelectorAll('span');
    window.addEventListener('mousemove', function(e) {
        spans.forEach(span => {
            const rect = span.getBoundingClientRect();
            const charX = rect.left + rect.width / 2;
            const charY = rect.top + rect.height / 2;
            const dx = e.clientX - charX;
            const dy = e.clientY - charY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 200;
            const weight = Math.max(100, 900 - (distance / maxDist) * 800);
            const size = Math.max(1, 1.5 - (distance / maxDist) * 0.5);
            span.style.fontWeight = Math.round(weight);
            span.style.transform = `scale(${size})`;
            span.style.color = distance < 100 ? '#ff4d79' : '#c2185b';
        });
    });
}

window.addEventListener('load', initTextPressure);
