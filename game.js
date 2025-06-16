class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Game state
        this.gameStarted = false;
        this.isGameOver = false;  // Add game over state
        this.score = 0; // Track score based on enemy kills
        this.player = {
            x: 0,  // Changed to 0 since we'll use transform
            y: 0,  // Changed to 0 since we'll use transform
            size: 30,
            speed: 5,
            level: 1,
            exp: 0,
            maxExp: 100,
            attackSpeed: 500, // Time between shots in milliseconds
            attackPower: 20,
            lastShot: 0,
            bulletCount: 1, // Number of bullets fired each time
            bulletSize: 8 // Default bullet size
        };
        
        this.bullets = [];
        this.enemies = [];
        this.keys = {};
        this.mousePos = { x: this.canvas.width/2, y: this.canvas.height/2 }; // Default mouse position
        
        // Game settings
        this.enemySpawnRate = 1000;
        this.lastEnemySpawn = 0;
        this.difficultyTimer = 0;
        this.debugMode = true; // Enable debug mode
        
        this.setupEventListeners();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
        
        // Mouse position tracking
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        
        window.addEventListener('resize', () => this.setupCanvas());
        
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        
        document.querySelectorAll('.stat-button').forEach(button => {
            button.addEventListener('click', () => {
                const stat = button.dataset.stat;
                this.upgradeStat(stat);
                document.getElementById('levelUpScreen').style.display = 'none';
                this.gameStarted = true;
            });
        });
    }
    
    startGame() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        document.getElementById('score').textContent = 'Score: ' + this.score;
        this.gameStarted = true;
        this.gameLoop();
    }
    
    upgradeSpecialStat(stat) {
        switch(stat) {
            case 'bulletCount':
                this.player.bulletCount += 1;
                break;
            case 'bulletSize':
                this.player.bulletSize += 2;
                break;
        }
    }
    
    upgradeStat(stat) {
        switch(stat) {
            case 'attackSpeed':
                this.player.attackSpeed = Math.max(100, this.player.attackSpeed - 50);
                break;
            case 'attackPower':
                this.player.attackPower += 10;
                break;
            case 'moveSpeed':
                this.player.speed += 1;
                break;
            case 'bulletCount':
                this.player.bulletCount += 1;
                break;
            case 'bulletSize':
                this.player.bulletSize += 2;
                break;
        }
    }
    
    updatePlayer() {
        if (this.keys['w']) this.player.y -= this.player.speed;
        if (this.keys['s']) this.player.y += this.player.speed;
        if (this.keys['a']) this.player.x -= this.player.speed;
        if (this.keys['d']) this.player.x += this.player.speed;
        
        this.fireAutomatically();
    }
    
    fireAutomatically() {
        const now = Date.now();
        const timeSinceLastShot = now - this.player.lastShot;
        
        if (this.debugMode) {
            this.debugTimeSinceLastShot = timeSinceLastShot;
            this.debugAttackSpeed = this.player.attackSpeed;
        }
        
        if (timeSinceLastShot >= this.player.attackSpeed) {
            // Calculate direction from player to mouse
            const dx = this.mousePos.x - this.canvas.width/2;
            const dy = this.mousePos.y - this.canvas.height/2;
            const angle = Math.atan2(dy, dx);
            
            // Create multiple bullets if bulletCount > 1
            for (let i = 0; i < this.player.bulletCount; i++) {
                // For multiple bullets, add a small spread angle
                let bulletAngle = angle;
                if (this.player.bulletCount > 1) {
                    // Create a spread effect when firing multiple bullets
                    const spreadRange = 0.3; // Radians
                    bulletAngle = angle + (i / (this.player.bulletCount - 1) - 0.5) * spreadRange;
                    if (this.player.bulletCount === 1) bulletAngle = angle; // No spread for single bullet
                }
                
                this.bullets.push({
                    x: this.player.x,
                    y: this.player.y,
                    speed: 10,
                    angle: bulletAngle,
                    power: this.player.attackPower,
                    createdAt: now,
                    size: this.player.bulletSize
                });
            }
            
            // Update last shot time
            this.player.lastShot = now;
            
            if (this.debugMode) {
            }
        }
    }
    
    updateBullets() {
        // Log bullet count before update
        if (this.debugMode) {
        }
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Update bullet position
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;
            
            // Log bullet position for debugging
            
            // Check if bullet is off screen - use a MUCH larger boundary
            const farDistance = 2000; // Increased from canvas dimensions
            if (
                bullet.x < this.player.x - farDistance ||
                bullet.x > this.player.x + farDistance ||
                bullet.y < this.player.y - farDistance ||
                bullet.y > this.player.y + farDistance
            ) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    spawnEnemy() {
        const now = Date.now();
        if (now - this.lastEnemySpawn >= this.enemySpawnRate) {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            
            // Spawn enemies relative to player position
            const spawnDistance = 800;
            
            switch(side) {
                case 0: // top
                    x = this.player.x + (Math.random() - 0.5) * spawnDistance;
                    y = this.player.y - spawnDistance;
                    break;
                case 1: // right
                    x = this.player.x + spawnDistance;
                    y = this.player.y + (Math.random() - 0.5) * spawnDistance;
                    break;
                case 2: // bottom
                    x = this.player.x + (Math.random() - 0.5) * spawnDistance;
                    y = this.player.y + spawnDistance;
                    break;
                case 3: // left
                    x = this.player.x - spawnDistance;
                    y = this.player.y + (Math.random() - 0.5) * spawnDistance;
                    break;
            }
            
            this.enemies.push({
                x: x,
                y: y,
                size: 20,
                speed: 2 + this.difficultyTimer / 10000,
                health: 50 + this.difficultyTimer / 1000,
                maxHealth: 50 + this.difficultyTimer / 1000
            });
            
            this.lastEnemySpawn = now;
        }
    }
    
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Move towards player
            const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
            enemy.x += Math.cos(angle) * enemy.speed;
            enemy.y += Math.sin(angle) * enemy.speed;
            
            // Check bullet collisions
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemy.size) {
                    enemy.health -= bullet.power;
                    this.bullets.splice(j, 1);
                    
                    if (enemy.health <= 0) {
                        this.enemies.splice(i, 1);
                        this.score++; // Increment score when enemy is killed
                        // Update score display
                        document.getElementById('score').textContent = 'Score: ' + this.score;
                        this.addExperience(20);
                        break;
                    }
                }
            }
            
            // Only check player collision if game is not over
            if (!this.isGameOver) {
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.player.size/2 + enemy.size/2) {
                    this.gameOver();
                }
            }
        }
    }
    
    addExperience(amount) {
        this.player.exp += amount;
        if (this.player.exp >= this.player.maxExp) {
            this.levelUp();
        }
        document.getElementById('expFill').style.width = (this.player.exp / this.player.maxExp * 100) + '%';
    }
    
    levelUp() {
        this.player.level++;
        this.player.exp = 0;
        this.player.maxExp *= 1.2;
        document.getElementById('level').textContent = 'Level: ' + this.player.level;
        
        // Get the level up screen
        const levelUpScreen = document.getElementById('levelUpScreen');
        
        // Show special upgrades every 3 levels
        if (this.player.level % 3 === 0) {
            // Make sure the special stat buttons are visible
            const specialButtons = document.querySelectorAll('[data-stat="bulletCount"], [data-stat="bulletSize"]');
            specialButtons.forEach(button => {
                button.style.display = 'block';
            });
        } else {
            // Hide the special stat buttons for non-3rd levels
            const specialButtons = document.querySelectorAll('[data-stat="bulletCount"], [data-stat="bulletSize"]');
            specialButtons.forEach(button => {
                button.style.display = 'none';
            });
        }
        
        levelUpScreen.style.display = 'block';
        this.gameStarted = false;
    }
    
    gameOver() {
        if (!this.isGameOver) {  // Only show game over once
            this.isGameOver = true;
            this.gameStarted = false;
            alert('Game Over! Score: ' + this.score); // Show score instead of level
            location.reload();
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save the current context state
        this.ctx.save();
        
        // Move the canvas to center the player
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.translate(-this.player.x, -this.player.y);
        
        // Draw player (always at 0,0 in transformed space)
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.size/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw bullets - with player-defined size
        this.ctx.fillStyle = '#FFFF00'; // Bright yellow
        for (const bullet of this.bullets) {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size || this.player.bulletSize, 0, Math.PI * 2); // Use bullet's size if available
            this.ctx.fill();
            
            // Draw a trail behind the bullet
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(bullet.x, bullet.y);
            this.ctx.lineTo(
                bullet.x - Math.cos(bullet.angle) * 15,
                bullet.y - Math.sin(bullet.angle) * 15
            );
            this.ctx.stroke();
        }
        
        // Draw enemies
        for (const enemy of this.enemies) {
            // Enemy body
            this.ctx.fillStyle = '#ff4444';
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Health bar
            const healthBarWidth = 40;
            const healthBarHeight = 4;
            const healthPercentage = enemy.health / enemy.maxHealth;
            
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(enemy.x - healthBarWidth/2, enemy.y - enemy.size - 10, 
                            healthBarWidth, healthBarHeight);
            
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillRect(enemy.x - healthBarWidth/2, enemy.y - enemy.size - 10, 
                            healthBarWidth * healthPercentage, healthBarHeight);
        }
        
        // Restore the context state
        this.ctx.restore();
        
        // Draw crosshair at mouse position
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.mousePos.x - 10, this.mousePos.y);
        this.ctx.lineTo(this.mousePos.x + 10, this.mousePos.y);
        this.ctx.moveTo(this.mousePos.x, this.mousePos.y - 10);
        this.ctx.lineTo(this.mousePos.x, this.mousePos.y + 10);
        this.ctx.stroke();
        
        // Draw debug info
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 40); // Add score display
        this.ctx.fillText(`Mouse: (${Math.round(this.mousePos.x)}, ${Math.round(this.mousePos.y)})`, 10, 60);
        this.ctx.fillText(`Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`, 10, 80);
        this.ctx.fillText(`Bullets: ${this.bullets.length}`, 10, 100);
        
        // Additional debug info
        if (this.debugMode) {
            const now = Date.now();
            this.ctx.fillText(`Time since last shot: ${this.debugTimeSinceLastShot || 0}ms`, 10, 120);
            this.ctx.fillText(`Attack speed: ${this.debugAttackSpeed}ms`, 10, 140);
            this.ctx.fillText(`Should fire: ${(this.debugTimeSinceLastShot || 0) >= this.debugAttackSpeed}`, 10, 160);
            this.ctx.fillText(`Current time: ${now}`, 10, 180);
            this.ctx.fillText(`Last shot time: ${this.player.lastShot}`, 10, 200);
            
            // Add more bullet debug info
            if (this.bullets.length > 0) {
                const firstBullet = this.bullets[0];
                this.ctx.fillText(`First bullet: (${Math.round(firstBullet.x)}, ${Math.round(firstBullet.y)})`, 10, 220);
                this.ctx.fillText(`Bullet angle: ${firstBullet.angle.toFixed(2)}`, 10, 240);
            }
        }
    }
    
    gameLoop() {
        if (this.gameStarted && !this.isGameOver) {
            this.difficultyTimer++;
            this.updatePlayer();
            this.updateBullets();
            this.spawnEnemy();
            this.updateEnemies();
            this.draw();
        }
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 