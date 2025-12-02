// --- DATABASE (Crimes) ---
const crimes = [
    "მოიპარა ბებიის კბილები და ლომბარდში ჩააბარა",
    "შეჭამა მეზობლის Wi-Fi და მთელი უბანი უინტერნეტოდ დატოვა",
    "დააგვიანა საკუთარ ქორწილში ფეხბურთის ყურების გამო",
    "ჩუმად უსმენს რუსულ რეპს და თავს აჩვენებს რომ როკი უყვარს",
    "შეჭამა თანამშრომლის სადილი და დააბრალა კატას",
    "მოიპარა მარშრუტკის მძღოლის ხურდები",
    "ღამით პარკში იპარავს იხვებს",
    "დარეკა პოლიციაში რადგან პიცა დაუგვიანდა",
    "იყენებს ტუალეტის ქაღალდს ორივე მხრიდან",
    "გაყიდა უმცროსი ძმა 5 ლარად",
    "დადის წინდებით სანდლებში",
    "მოიპარა საახალწლო ნაძვის ხე მერიის წინ",
    "სვამს ყავას შაქრით და ამბობს რომ უშაქროა",
    "ატარებს მზის სათვალეს ღამის კლუბში",
    "შეჭამა პიცა ანანასით",
    "დაიფიცა დედა და მოიტყუა"
];

const punishments = [
    "მიესაჯა 5 წუთით კუთხეში დგომა",
    "ვალდებულია ყველას უყიდოს ნაყინი",
    "მიესაჯა 10 ჩაჯდომა",
    "უნდა იმღეროს საქართველოს ჰიმნი",
    "ერთი კვირა ვერ შევა ინსტაგრამზე",
    "უნდა აკოცოს პროკურორს ხელზე",
    "სამუდამო ბანი ტიკტოკზე"
];

// --- STATE ---
let players = [];
let usedCrimes = [];
let currentCase = {
    crime: "",
    prosecutor: null,
    defendant: null,
    jury: []
};
let votes = { guilty: 0, innocent: 0 };
let currentJurorIndex = 0;
let timerSeconds = 30;
let timerInterval;
let currentTimerCallback = null; // ინახავს რა უნდა მოხდეს დროის დასრულებისას

// --- INIT ---
window.onload = function() {
    createParticles();
    loadPlayers();
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('readyScreen').style.display = 'flex';
    }, 1500);
};

// --- NAV ---
function showMainPage() {
    document.getElementById('readyScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'flex';
    showSection('setupSection');
    document.getElementById('logoArea').style.display = 'block';
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if(id !== 'setupSection') document.getElementById('logoArea').style.display = 'none';
    else document.getElementById('logoArea').style.display = 'block';
}

// --- PLAYER MANAGE ---
function addPlayer() {
    const input = document.getElementById('playerName');
    const name = input.value.trim();
    if(name && !players.some(p => p.name === name)) {
        players.push({ name });
        input.value = '';
        updatePlayerList();
        savePlayers();
    }
}

function updatePlayerList() {
    const list = document.getElementById('playerList');
    list.innerHTML = '';
    players.forEach((p, i) => {
        list.innerHTML += `
            <div class="player-item">
                <span>${p.name}</span>
                <button onclick="removePlayer(${i})" style="background:none;border:none;color:var(--neon-red);cursor:pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
}

function removePlayer(i) { players.splice(i, 1); updatePlayerList(); savePlayers(); }
function savePlayers() { localStorage.setItem('courtPlayers', JSON.stringify(players)); }
function loadPlayers() {
    const data = localStorage.getItem('courtPlayers');
    if(data) {
        players = JSON.parse(data);
        updatePlayerList();
    }
}

// --- GAME LOGIC ---
function startGame() {
    if(players.length < 3) { alert('მინიმუმ 3 მოთამაშე!'); return; }
    
    timerSeconds = parseInt(document.getElementById('timerConfig').value);
    
    // Pick Crime
    let crime;
    if (usedCrimes.length >= crimes.length) usedCrimes = [];
    do {
        crime = crimes[Math.floor(Math.random() * crimes.length)];
    } while (usedCrimes.includes(crime));
    usedCrimes.push(crime);
    
    // Pick Roles
    let shuffled = [...players].sort(() => 0.5 - Math.random());
    currentCase.prosecutor = shuffled[0];
    currentCase.defendant = shuffled[1];
    currentCase.jury = shuffled.slice(2);
    currentCase.crime = crime;
    
    // Set UI
    document.getElementById('caseNumber').textContent = Math.floor(Math.random() * 900) + 100;
    document.getElementById('prosecutorName').textContent = currentCase.prosecutor.name;
    document.getElementById('defendantName').textContent = currentCase.defendant.name;
    document.getElementById('crimeText').textContent = `"${currentCase.crime}"`;
    
    showSection('caseSection');
}

// Phase 1: Prosecution
function startProsecution() {
    showSection('timerSection');
    document.getElementById('timerSpeakerTitle').textContent = `ბრალდება: ${currentCase.prosecutor.name}`;
    document.getElementById('timerSpeakerTitle').style.color = "var(--neon-red)";
    document.querySelector('.timer-container').className = "timer-container timer-red";
    
    startTimer(() => {
        // ეს კოდი შესრულდება, როცა დრო გავა ან ღილაკს დააჭერენ
        document.getElementById('timerControls').innerHTML = `
            <div style="margin-bottom:10px; color:#888;">დრო ამოიწურა</div>
            <button class="btn btn-blue" onclick="startDefense()">
                <i class="fas fa-shield-alt"></i> დაცვის სიტყვა
            </button>
        `;
    });
}

// Phase 2: Defense
function startDefense() {
    document.getElementById('timerSpeakerTitle').textContent = `დაცვა: ${currentCase.defendant.name}`;
    document.getElementById('timerSpeakerTitle').style.color = "var(--neon-blue)";
    document.querySelector('.timer-container').className = "timer-container timer-blue";
    
    startTimer(() => {
        // ეს კოდი შესრულდება, როცა დრო გავა ან ღილაკს დააჭერენ
        document.getElementById('timerControls').innerHTML = `
            <div style="margin-bottom:10px; color:#888;">დრო ამოიწურა</div>
            <button class="btn btn-gold" onclick="setupVoting()">
                <i class="fas fa-gavel"></i> განაჩენი
            </button>
        `;
    });
}

// --- TIMER SYSTEM (Updated) ---
function startTimer(onComplete) {
    let left = timerSeconds;
    const timerEl = document.getElementById('timer');
    currentTimerCallback = onComplete; // ვინახავთ ქოლბექს გლობალურად
    
    // 1. გამოვაჩინოთ "სიტყვის დასრულება" ღილაკი თავიდანვე
    document.getElementById('timerControls').innerHTML = `
        <button class="btn btn-secondary" onclick="finishSpeech()">
            <i class="fas fa-stop"></i> სიტყვის დასრულება
        </button>
    `;
    
    timerEl.textContent = formatTime(left);
    
    if(timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        left--;
        timerEl.textContent = formatTime(left);
        if(left <= 0) {
            finishSpeech(); // ავტომატურად ვასრულებთ
        }
    }, 1000);
}

// ახალი ფუნქცია: სიტყვის ნაადრევად დასრულება
function finishSpeech() {
    clearInterval(timerInterval);
    if(navigator.vibrate) navigator.vibrate(200);
    
    // ვასრულებთ შენახულ ქმედებას (შემდეგი ეტაპის ღილაკის გამოჩენა)
    if (currentTimerCallback) {
        currentTimerCallback(); 
        currentTimerCallback = null; // ვასუფთავებთ რომ ხელახლა არ გამოიძახოს
    }
}

function formatTime(s) {
    return s < 10 ? `00:0${s}` : `00:${s}`;
}

// Phase 3: Voting
function setupVoting() {
    votes = { guilty: 0, innocent: 0 };
    currentJurorIndex = 0;
    showVotingScreen();
}

function showVotingScreen() {
    showSection('votingSection');
    const juror = currentCase.jury[currentJurorIndex];
    document.getElementById('currentJurorName').textContent = juror.name;
    
    document.getElementById('juryTurnDisplay').style.display = 'block';
    document.getElementById('votingControls').style.display = 'none';
    document.getElementById('startVoteBtn').style.display = 'inline-flex';
}

function showVotingButtons() {
    document.getElementById('juryTurnDisplay').style.display = 'none';
    document.getElementById('startVoteBtn').style.display = 'none';
    document.getElementById('votingControls').style.display = 'block';
}

function castVote(type) {
    if(type === 'guilty') votes.guilty++;
    else votes.innocent++;
    
    currentJurorIndex++;
    if(currentJurorIndex >= currentCase.jury.length) {
        showVerdict();
    } else {
        showVotingScreen();
    }
}

// Phase 4: Verdict
function showVerdict() {
    showSection('verdictSection');
    const verdictEl = document.getElementById('finalVerdict');
    const punishEl = document.getElementById('punishmentText');
    
    document.getElementById('guiltyCount').textContent = votes.guilty;
    document.getElementById('innocentCount').textContent = votes.innocent;
    
    if (votes.guilty > votes.innocent) {
        verdictEl.textContent = "დამნაშავეა!";
        verdictEl.className = "verdict-display verdict-guilty";
        // Pick punishment
        const punishment = punishments[Math.floor(Math.random() * punishments.length)];
        punishEl.textContent = punishment;
    } else {
        verdictEl.textContent = "უდანაშაულოა!";
        verdictEl.className = "verdict-display verdict-innocent";
        punishEl.textContent = "ბრალდებული გათავისუფლებულია დარბაზიდან.";
    }
}

function restartGame() {
    showSection('setupSection');
    if(timerInterval) clearInterval(timerInterval);
}

// --- PARTICLES ---
function createParticles() {
    const c = document.getElementById("particles");
    for(let i=0; i<20; i++) {
        let p = document.createElement("div");
        p.className = "particle";
        p.style.left = Math.random()*100 + "%";
        p.style.animationDuration = (5 + Math.random()*10) + "s";
        c.appendChild(p);
    }
}