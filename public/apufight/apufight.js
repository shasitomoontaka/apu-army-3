document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const player = document.getElementById('player');
    const levelDisplay = document.getElementById('level');
    const startButton = document.getElementById('start-button');
    const preGameImage = document.getElementById('pre-game-image');
    const timerDisplay = document.getElementById('timer');
    const mobileControls = document.getElementById('mobile-controls');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const jumpBtn = document.getElementById('jump-btn');
    const shootBtn = document.getElementById('shoot-btn');

    let projectileGravity = 0.69;
    const baseGravity = 0.69;
    const maxGravityVariation = 0.2;
    let timerInterval;
    let startTime;
    let level = 1;
    let playerHealth = 100;
    let enemyHealth = 100;
    let enemySpeed = 1;
    let playerPosition = { x: 10, y: 10, isJumping: false, jumpVelocity: 0 };
    let enemyPosition = { x: 80, y: 10, isJumping: false, jumpVelocity: 0 };
    let projectiles = [];
    let enemyProjectiles = [];
    let keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
    let gameLoop;
    let lastShotTime = 0;
    let lastEnemyShotTime = 0;
    const enemyShotCooldown = 420;
    const shotCooldown = 69;
    const gravity = 0.69;
    const jumpHeight = 6.9;
    const groundLevel = 10;

    const enemyImages = [
        '/apufight/enemy1.png',
        '/apufight/enemy2.png',
        '/apufight/enemy3.png',
        '/apufight/enemy4.png',
        '/apufight/enemy5.png',
        '/apufight/enemy6.png',
        '/apufight/enemy7.png',
        '/apufight/enemy8.png',
        '/apufight/enemy9.png',
        '/apufight/enemy10.png'
    ];

    function preloadImages(urls, callback) {
        let loaded = 0;
        urls.forEach(url => {
            const img = new Image();
            img.onload = img.onerror = () => {
                loaded++;
                if (loaded === urls.length) callback();
            };
            img.src = url;
        });
    }

    function showStartScreen() {
        preGameImage.style.display = 'block';
        startButton.style.display = 'block';
        timerDisplay.style.display = 'none';
        player.style.display = 'none';
        // Only show mobile controls on small screens
        if (window.innerWidth <= 768) mobileControls.style.display = 'flex';
        else mobileControls.style.display = 'none';
        if (currentEnemy) currentEnemy.style.display = 'none';
    }

    function startGame() {
        preGameImage.style.display = 'none';
        startButton.style.display = 'none';
        timerDisplay.style.display = 'block';
        player.style.display = 'block';
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        initGame();
    }

    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = `Time: ${elapsed}s`;
    }

    function stopTimer() { clearInterval(timerInterval); }

    function createEnemy() {
        const enemy = document.createElement('div');
        enemy.className = 'enemy';
        enemy.style.backgroundImage = `url('${enemyImages[level - 1]}')`;
        gameContainer.appendChild(enemy);
        return enemy;
    }

    let currentEnemy;

    function updatePositions() {
        player.style.left = `${playerPosition.x}%`;
        player.style.bottom = `${playerPosition.y}%`;
        if (currentEnemy) {
            currentEnemy.style.right = `${100 - enemyPosition.x}%`;
            currentEnemy.style.bottom = `${enemyPosition.y}%`;
        }
    }

    function movePlayer(dir) {
        const speed = 1;
        if (dir === 'left' && playerPosition.x > 0) playerPosition.x -= speed;
        if (dir === 'right' && playerPosition.x < 90) playerPosition.x += speed;
    }

    function moveEnemy() {
        let rightLimit = 90;
        let leftLimit = Math.max(50, 80 - (level - 1) * 5);
        let changeChance = level <= 5 ? 0.1 + (level - 1) * 0.02 : 0.1 + (level - 6) * 0.01;
        enemyPosition.x += enemySpeed;
        if (enemyPosition.x < leftLimit) enemyPosition.x = leftLimit;
        if (enemyPosition.x > rightLimit) enemyPosition.x = rightLimit;
        if (Math.random() < changeChance) enemySpeed *= -1;
    }

    function jumpPlayer() {
        if (!playerPosition.isJumping) { playerPosition.isJumping = true; playerPosition.jumpVelocity = jumpHeight; }
    }

    function jumpEnemy() {
        if (!enemyPosition.isJumping) { enemyPosition.isJumping = true; enemyPosition.jumpVelocity = jumpHeight; }
    }

    function applyGravity() {
        if (playerPosition.isJumping) {
            playerPosition.y += playerPosition.jumpVelocity;
            playerPosition.jumpVelocity -= gravity;
            if (playerPosition.y <= groundLevel) { playerPosition.y = groundLevel; playerPosition.isJumping = false; }
        }
        if (enemyPosition.isJumping) {
            enemyPosition.y += enemyPosition.jumpVelocity;
            enemyPosition.jumpVelocity -= gravity;
            if (enemyPosition.y <= groundLevel) { enemyPosition.y = groundLevel; enemyPosition.isJumping = false; }
        }
    }

    function shoot(isPlayer) {
        const now = Date.now();
        if (isPlayer && now - lastShotTime < shotCooldown) return;

        const proj = document.createElement('div');
        proj.className = 'projectile';
        proj.style.backgroundImage = isPlayer ? "url('/apufight/player-projectile.png')" : "url('/apufight/enemy-projectile.png')";

        if (isPlayer) {
            proj.style.left = `${playerPosition.x + 2}%`;
            proj.style.bottom = `${playerPosition.y + 5}%`;
            projectiles.push(proj);
            lastShotTime = now;
        } else {
            proj.style.left = `${enemyPosition.x - 2}%`;
            proj.style.bottom = `${enemyPosition.y + 5}%`;
            enemyProjectiles.push(proj);
        }

        gameContainer.appendChild(proj);
    }

    function updateProjectileGravity() {
        projectileGravity = baseGravity + maxGravityVariation * (Math.random() * 2 - 1);
    }

    function moveProjectiles() {
        const freq = 0.1 + (level - 1) * 0.05;
        if (Math.random() < freq) updateProjectileGravity();

        projectiles.forEach((p, i) => {
            const l = parseFloat(p.style.left);
            const b = parseFloat(p.style.bottom);
            p.style.bottom = `${b - projectileGravity}%`;
            if (l > 100 || b <= groundLevel) { p.remove(); projectiles.splice(i, 1); }
            else p.style.left = `${l + 2}%`;
        });

        enemyProjectiles.forEach((p, i) => {
            const l = parseFloat(p.style.left);
            const b = parseFloat(p.style.bottom);
            p.style.bottom = `${b - projectileGravity}%`;
            if (l < 0 || b <= groundLevel) { p.remove(); enemyProjectiles.splice(i, 1); }
            else p.style.left = `${l - 2}%`;
        });
    }

    function checkCollisions() {
        projectiles.forEach((p, i) => {
            const pr = p.getBoundingClientRect();
            const er = currentEnemy.getBoundingClientRect();
            if (pr.right >= er.left && pr.left <= er.right && pr.bottom >= er.top && pr.top <= er.bottom) {
                enemyHealth -= 10; p.remove(); projectiles.splice(i, 1); updateHUD(); checkLevelUp();
            }
        });

        enemyProjectiles.forEach((p, i) => {
            const pr = p.getBoundingClientRect();
            const plr = player.getBoundingClientRect();
            if (pr.right >= plr.left && pr.left <= plr.right && pr.bottom >= plr.top && pr.top <= plr.bottom) {
                playerHealth -= 10; p.remove(); enemyProjectiles.splice(i, 1); updateHUD(); checkGameOver();
            }
        });
    }

    function updateHUD() {
        levelDisplay.textContent = `Level: ${level}`;
        document.getElementById('player-health-bar-inner').style.width = `${Math.max(playerHealth, 0)}%`;
        const enemyMaxHealth = 100 + (level - 1) * 10;
        document.getElementById('enemy-health-bar-inner').style.width = `${Math.max(enemyHealth, 0) / enemyMaxHealth * 100}%`;
    }

    function checkLevelUp() {
        if (enemyHealth <= 0) {
            level++;
            if (level > 10) { alert('Congratulations! You won the game!'); stopTimer(); resetGame(); }
            else { enemyHealth = 100 + (level - 1) * 10; enemySpeed = 0.5 + (level - 5) * 0.01; currentEnemy.remove(); currentEnemy = createEnemy(); updateHUD(); }
        }
    }

    function checkGameOver() {
        if (playerHealth <= 0) { playerHealth = 0; updateHUD(); stopTimer(); clearInterval(gameLoop); setTimeout(handleGameOver, 500); }
    }

    function handleGameOver() { alert('Game Over! Try again.'); resetGame(); }

    function resetGame() {
        level = 1; playerHealth = 100; enemyHealth = 100; enemySpeed = 1;
        playerPosition = { x: 10, y: 10, isJumping: false, jumpVelocity: 0 };
        enemyPosition = { x: 80, y: 10, isJumping: false, jumpVelocity: 0 };
        projectiles.forEach(p => p.remove());
        enemyProjectiles.forEach(p => p.remove());
        projectiles = []; enemyProjectiles = [];
        projectileGravity = baseGravity;
        if (currentEnemy) { currentEnemy.remove(); currentEnemy = null; }
        timerDisplay.textContent = 'Time: 0s';
        updateHUD();
        clearInterval(gameLoop);
        showStartScreen();
    }

    function gameUpdate() {
        if (keys.ArrowLeft) movePlayer('left');
        if (keys.ArrowRight) movePlayer('right');
        if (keys.ArrowUp) jumpPlayer();
        applyGravity();
        moveEnemy();
        moveProjectiles();
        updatePositions();
        checkCollisions();

        const now = Date.now();
        if (Math.random() < 0.05 + level * 0.01 && now - lastEnemyShotTime >= enemyShotCooldown) {
            shoot(false); lastEnemyShotTime = now;
            if (Math.random() < 0.5 + level * 0.05) jumpEnemy();
        }
    }

    function handleTouchStart(e) {
        e.preventDefault();
        const id = e.target.id;
        if (id === 'left-btn') keys.ArrowLeft = true;
        if (id === 'right-btn') keys.ArrowRight = true;
        if (id === 'jump-btn') keys.ArrowUp = true;
        if (id === 'shoot-btn') shoot(true);
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        const id = e.target.id;
        if (id === 'left-btn') keys.ArrowLeft = false;
        if (id === 'right-btn') keys.ArrowRight = false;
        if (id === 'jump-btn') keys.ArrowUp = false;
    }

    if (window.innerWidth <= 768) {
        leftBtn.addEventListener('touchstart', handleTouchStart);
        rightBtn.addEventListener('touchstart', handleTouchStart);
        jumpBtn.addEventListener('touchstart', handleTouchStart);
        shootBtn.addEventListener('touchstart', handleTouchStart);

        leftBtn.addEventListener('touchend', handleTouchEnd);
        rightBtn.addEventListener('touchend', handleTouchEnd);
        jumpBtn.addEventListener('touchend', handleTouchEnd);

        mobileControls.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    }

    function initGame() {
        preloadImages([
            '/apufight/background.jpg',
            '/apufight/player.png',
            '/apufight/player-projectile.png',
            '/apufight/enemy-projectile.png',
            ...enemyImages
        ], () => {
            if (window.innerWidth <= 768) mobileControls.style.display = 'flex';
            currentEnemy = createEnemy();
            updateHUD();
            gameLoop = setInterval(gameUpdate, 1000 / 30);
        });
    }

    document.addEventListener('keydown', e => {
        if (e.code in keys) keys[e.code] = true;
        if (e.code === 'Space') shoot(true);
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    });

    document.addEventListener('keyup', e => { if (e.code in keys) keys[e.code] = false; });

    startButton.addEventListener('click', startGame);
    showStartScreen();
});
