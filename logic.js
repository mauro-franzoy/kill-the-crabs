const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawGame();
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const sectionHeight = canvas.height / 3;
    
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 15;
    ctx.shadowColor = '#00FF00';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(0, sectionHeight);
    ctx.lineTo(canvas.width, sectionHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, sectionHeight * 2);
    ctx.lineTo(canvas.width, sectionHeight * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 15);
    ctx.lineTo(canvas.width, canvas.height - 15);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
