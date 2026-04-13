let scene, camera, renderer, car, road;
let items = [];
let score = 0, gameActive = true; 
let keys = {};
let zombies = [];

function init() {
    // 檢查 THREE 是否存在
    if (typeof THREE === 'undefined') {
        console.error("Three.js 未載入成功");
        return;
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x220000); 
    scene.fog = new THREE.Fog(0x220000, 35, 110);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 18, 30); 
    camera.lookAt(0, 0, 5); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    const roadGeo = new THREE.PlaneGeometry(40, 2000);
    const roadMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    // 賽車
    car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 2.2), new THREE.MeshPhongMaterial({ color: 0xee0000 }));
    body.position.y = 0.3;
    car.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1), new THREE.MeshPhongMaterial({ color: 0x000000 }));
    cabin.position.set(0, 0.8, -0.1);
    car.add(cabin);
    scene.add(car);

    // 光效
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(10, 20, 10); // 已修正原本的 sun.sun 錯誤
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);

    spawnZombieHorde(); 
    spawnObstacles();
    animate();
}

function spawnZombieHorde() {
    const zombieEmojis = ["🧟", "🧟‍♂️", "🧟‍♀️"];
    const hordeSize = 160; 
    const rows = 8; 

    for (let row = 0; row < rows; row++) {
        for (let i = 0; i < hordeSize/rows; i++) {
            const texture = createTextTexture(zombieEmojis[(row + i) % 3]);
            const spriteMat = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMat);
            
            const x = ((i / (hordeSize/rows)) - 0.5) * 45 + (row % 2 * 0.5);
            const z = 16 + row * 3.5 + (Math.random() - 0.5) * 2;
            
            sprite.position.set(x, 1.3, z);
            sprite.scale.set(3, 3, 1);
            scene.add(sprite);
            
            zombies.push({
                sprite: sprite,
                phaseX: Math.random() * 6.28,
                phaseY: Math.random() * 6.28,
                row: row
            });
        }
    }
}

function createTextTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = '90px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

function spawnObstacles() {
    if(!gameActive) return;
    const size = 1.2 + Math.random() * 1.0; 
    const geo = new THREE.DodecahedronGeometry(size);
    const mat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((Math.random()-0.5)*35, size/2, -150); 
    mesh.userData = { radius: size }; 
    scene.add(mesh);
    items.push(mesh);
    setTimeout(spawnObstacles, Math.max(150, 700 - score * 3));
}

function animate() {
    if (!gameActive) return;
    requestAnimationFrame(animate);

    let isBlocked = false;
    const time = Date.now() * 0.003;

    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let dx = Math.abs(car.position.x - item.position.x);
        let dz = item.position.z - car.position.z;
        if (dx < (1.2 + item.userData.radius * 0.5) && dz > -1.5 && dz < 1.5) {
            isBlocked = true;
            break;
        }
    }

    const moveSpeed = 0.4; 
    const worldSpeed = isBlocked ? 0 : (1.4 + score/50); 

    if (isBlocked) car.position.z += 0.15; // 撞到石頭往後壓的速度

    if (keys["ArrowLeft"] && car.position.x > -18) car.position.x -= moveSpeed;
    if (keys["ArrowRight"] && car.position.x < 18) car.position.x += moveSpeed;
    if (keys["ArrowUp"] && car.position.z > -30) car.position.z -= moveSpeed;
    if (keys["ArrowDown"] && car.position.z < 12) car.position.z += moveSpeed;

    zombies.forEach(z => {
        z.sprite.position.y = 1.3 + Math.sin(time + z.phaseY) * 0.15;
        z.sprite.position.x += Math.cos(time + z.phaseX) * 0.01;
    });

    if (car.position.z > 14.5) gameOver("被殭屍海抓住了！");

    for (let i = items.length - 1; i >= 0; i--) {
        items[i].position.z += worldSpeed; 
        if (items[i].position.z > 40) {
            score++;
            document.getElementById('score').innerText = score;
            scene.remove(items[i]);
            items.splice(i, 1);
        }
    }
    renderer.render(scene, camera);
}

function gameOver(msg) {
    gameActive = false;
    alert(msg + "\n避開障礙數: " + score);
    location.reload();
}

// 確保 DOM 載入後再執行
window.onload = init;