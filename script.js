class Tool {
    // random number.
    static randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    // random color rgb.
    static randomColorRGB() {
        return (
            "rgb(" +
            this.randomNumber(0, 255) +
            ", " +
            this.randomNumber(0, 255) +
            ", " +
            this.randomNumber(0, 255) +
            ")"
        );
    }
    // random color hsl.
    static randomColorHSL(saturation, lightness) {
        return (
            "hsl(" +
            this.randomNumber(0, 360) +
            ", " +
            saturation +
            "%, " +
            lightness +
            "%)"
        );
    }
}

/*
  When want to use Angle and radian.
*/

class Angle {
    constructor(a) {
        this.a = a;
        this.rad = this.a * Math.PI / 180;
    }

    incDec(num) {
        this.a += num;
        this.rad = this.a * Math.PI / 180;
    }
}

let canvas;

class Canvas {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.mouseX = null;
        this.mouseY = null;
        this.heartNum = 100;
        this.hearts = [];
        if (this.width < 768) {
            this.heartNum = 50;
        } else {
            this.heartNum = 100;
        }
    }

    init() {
        for (let i = 0; i < this.heartNum; i++) {
            const s = new Heart(
                this.ctx,
                Tool.randomNumber(0, this.width),
                Tool.randomNumber(this.height - this.height / 2, this.height),
                Tool.randomNumber(10, 80)
            );
            this.hearts.push(s);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        for (let i = 0; i < this.hearts.length; i++) {
            this.hearts[i].render(i);
        }
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        if (this.width < 768) {
            this.heartNum = 50;
        } else {
            this.heartNum = 100;
        }
    }
}

class Heart {
    constructor(ctx, x, y, r) {
        this.ctx = ctx;
        this.init(x, y, r);
    }

    init(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r * 0.8;
        this.maxR = r;
        this.c = 'white';
        this.ga = Math.random();
        this.l = Tool.randomNumber(50, 500);
        this.sl = this.l;
        this.v = {
            r: 0,
            x: Tool.randomNumber(-1, 1) * Math.random(),
            y: -Math.random()
        };
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = this.ga;
        ctx.fillStyle = this.c;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.r);
        ctx.bezierCurveTo(
            this.x - this.r - this.r / 5,
            this.y + this.r / 1.5,
            this.x - this.r,
            this.y - this.r,
            this.x,
            this.y - this.r / 3
        );
        ctx.bezierCurveTo(
            this.x + this.r,
            this.y - this.r,
            this.x + this.r + this.r / 5,
            this.y + this.r / 1.5,
            this.x,
            this.y + this.r
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    stretch() {
        this.v.r += (this.maxR - this.r) * 0.1;
        this.v.r *= 0.9;
        this.r += this.v.r;
        if (this.l < 0) {
            this.l = Tool.randomNumber(50, 200);
            this.init(
                Tool.randomNumber(0, canvas.width),
                Tool.randomNumber(canvas.height - canvas.height / 2, canvas.height),
                Tool.randomNumber(10, 80)
            );
        }
    }

    updatePosition() {
        this.v.y -= 0.001;
        this.y += this.v.y;
        this.x += this.v.x;
    }

    updateParams() {
        const ratio = this.l / this.sl / 2;
        this.ga = ratio;
        this.l -= 1;
    }

    render() {
        this.updatePosition();
        this.updateParams();
        this.stretch();
        this.draw();
    }
}

(function () {
    "use strict";
    window.addEventListener("load", function () {
        canvas = new Canvas();
        canvas.init();
        function render() {
            window.requestAnimationFrame(function () {
                canvas.render();
                render();
            });
        }

        render();

        // event
        window.addEventListener(
            "resize",
            function () {
                canvas.resize();
                canvas.hearts = [];
                canvas.particles = [];
                canvas.init();
            },
            false
        );
    });
})();
//   ------------------------------------------------
// start hearts

var heart_canvas = document.getElementById("heart");

heart_canvas.width = window.innerWidth;
heart_canvas.height = window.innerHeight;

var gl = heart_canvas.getContext("webgl");
if (!gl) {
    console.error("Unable to initialize WebGL.");
}

var time = 0.0;

var vertexSource = `
attribute vec2 position;
void main() {
	gl_Position = vec4(position, 0.0, 1.0);
}
`;

var fragmentSource = `
precision highp float;

uniform float width;
uniform float height;
vec2 resolution = vec2(width, height);

uniform float time;

#define POINT_COUNT 8

vec2 points[POINT_COUNT];
const float speed = -0.5;
const float len = 0.25;
float intensity = 1.3;
float radius = 0.008;

//https://www.shadertoy.com/view/MlKcDD
//Signed distance to a quadratic bezier
float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C){    
	vec2 a = B - A;
	vec2 b = A - 2.0*B + C;
	vec2 c = a * 2.0;
	vec2 d = A - pos;

	float kk = 1.0 / dot(b,b);
	float kx = kk * dot(a,b);
	float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
	float kz = kk * dot(d,a);      

	float res = 0.0;

	float p = ky - kx*kx;
	float p3 = p*p*p;
	float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
	float h = q*q + 4.0*p3;

	if(h >= 0.0){ 
		h = sqrt(h);
		vec2 x = (vec2(h, -h) - q) / 2.0;
		vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
		float t = uv.x + uv.y - kx;
		t = clamp( t, 0.0, 1.0 );

		// 1 root
		vec2 qos = d + (c + b*t)*t;
		res = length(qos);
	}else{
		float z = sqrt(-p);
		float v = acos( q/(p*z*2.0) ) / 3.0;
		float m = cos(v);
		float n = sin(v)*1.732050808;
		vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
		t = clamp( t, 0.0, 1.0 );

		// 3 roots
		vec2 qos = d + (c + b*t.x)*t.x;
		float dis = dot(qos,qos);
        
		res = dis;

		qos = d + (c + b*t.y)*t.y;
		dis = dot(qos,qos);
		res = min(res,dis);
		
		qos = d + (c + b*t.z)*t.z;
		dis = dot(qos,qos);
		res = min(res,dis);

		res = sqrt( res );
	}
    
	return res;
}


//http://mathworld.wolfram.com/HeartCurve.html
vec2 getHeartPosition(float t){
	return vec2(16.0 * sin(t) * sin(t) * sin(t),
							-(13.0 * cos(t) - 5.0 * cos(2.0*t)
							- 2.0 * cos(3.0*t) - cos(4.0*t)));
}

//https://www.shadertoy.com/view/3s3GDn
float getGlow(float dist, float radius, float intensity){
	return pow(radius/dist, intensity);
}

float getSegment(float t, vec2 pos, float offset, float scale){
	for(int i = 0; i < POINT_COUNT; i++){
		points[i] = getHeartPosition(offset + float(i)*len + fract(speed * t) * 6.28);
	}
    
	vec2 c = (points[0] + points[1]) / 2.0;
	vec2 c_prev;
	float dist = 10000.0;
    
	for(int i = 0; i < POINT_COUNT-1; i++){
		//https://tinyurl.com/y2htbwkm
		c_prev = c;
		c = (points[i] + points[i+1]) / 2.0;
		dist = min(dist, sdBezier(pos, scale * c_prev, scale * points[i], scale * c));
	}
	return max(0.0, dist);
}

void main(){
	vec2 uv = gl_FragCoord.xy/resolution.xy;
	float widthHeightRatio = resolution.x/resolution.y;
	vec2 centre = vec2(0.5, 0.5);
	vec2 pos = centre - uv;
	pos.y /= widthHeightRatio;
	//Shift upwards to centre heart
	pos.y += 0.02;
	float scale = 0.000015 * height;
	
	float t = time;
    
	//Get first segment
  float dist = getSegment(t, pos, 0.0, scale);
  float glow = getGlow(dist, radius, intensity);
  
  vec3 col = vec3(0.0);

	//White core
  col += 10.0*vec3(smoothstep(0.003, 0.001, dist));
  //Pink glow
  col += glow * vec3(1.0,0.05,0.3);
  
  //Get second segment
  dist = getSegment(t, pos, 3.4, scale);
  glow = getGlow(dist, radius, intensity);
  
  //White core
  col += 10.0*vec3(smoothstep(0.003, 0.001, dist));
  //Blue glow
  col += glow * vec3(0.1,0.4,1.0);
        
	//Tone mapping
	col = 1.0 - exp(-col);

	//Gamma
	col = pow(col, vec3(0.4545));

	//Output to screen
 	gl_FragColor = vec4(col,1.0);
}
`;

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
    heart_canvas.width = window.innerWidth;
    heart_canvas.height = window.innerHeight;
    gl.viewport(0, 0, heart_canvas.width, heart_canvas.height);
    gl.uniform1f(widthHandle, window.innerWidth);
    gl.uniform1f(heightHandle, window.innerHeight);
}

function compileShader(shaderSource, shaderType) {
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw "Shader compile failed with: " + gl.getShaderInfoLog(shader);
    }
    return shader;
}

function getAttribLocation(program, name) {
    var attributeLocation = gl.getAttribLocation(program, name);
    if (attributeLocation === -1) {
        throw "Cannot find attribute " + name + ".";
    }
    return attributeLocation;
}

function getUniformLocation(program, name) {
    var attributeLocation = gl.getUniformLocation(program, name);
    if (attributeLocation === -1) {
        throw "Cannot find uniform " + name + ".";
    }
    return attributeLocation;
}

var vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
var fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);

var program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

gl.useProgram(program);

var vertexData = new Float32Array([-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0]);

var vertexDataBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

var positionHandle = getAttribLocation(program, "position");

gl.enableVertexAttribArray(positionHandle);
gl.vertexAttribPointer(positionHandle, 2, gl.FLOAT, false, 2 * 4, 0);

var timeHandle = getUniformLocation(program, "time");
var widthHandle = getUniformLocation(program, "width");
var heightHandle = getUniformLocation(program, "height");

gl.uniform1f(widthHandle, window.innerWidth);
gl.uniform1f(heightHandle, window.innerHeight);

var lastFrame = Date.now();
var thisFrame;

function draw() {
    thisFrame = Date.now();
    time += (thisFrame - lastFrame) / 1000;
    lastFrame = thisFrame;

    gl.uniform1f(timeHandle, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(draw);
}

draw();

// slider



// ----------------------
$('.slider').slick({
    draggable: true,
    autoplay: true,
    autoplaySpeed: 7000,
    arrows: false,
    dots: false,
    fade: true,
    speed: 500,
    infinite: true,
    cssEase: 'ease-in-out',
    touchThreshold: 100
})

// ---------------------

var love = setInterval(function () {
    var r_num = Math.floor(Math.random() * 40) + 1;
    var r_size = Math.floor(Math.random() * 65) + 10;
    var r_left = Math.floor(Math.random() * 100) + 1;
    var r_bg = Math.floor(Math.random() * 25) + 100;
    var r_time = Math.floor(Math.random() * 5) + 5;
    $('.bg_heart').append("<div class='heart' style='width:" + r_size + "px;height:" + r_size + "px;left:" + r_left + "%;background:rgba(255," + (r_bg - 25) + "," + r_bg + ",1);-webkit-animation:love " + r_time + "s ease;-moz-animation:love " + r_time + "s ease;-ms-animation:love " + r_time + "s ease;animation:love " + r_time + "s ease'></div>");

    $('.bg_heart').append("<div class='heart' style='width:" + (r_size - 10) + "px;height:" + (r_size - 10) + "px;left:" + (r_left + r_num) + "%;background:rgba(255," + (r_bg - 25) + "," + (r_bg + 25) + ",1);-webkit-animation:love " + (r_time + 5) + "s ease;-moz-animation:love " + (r_time + 5) + "s ease;-ms-animation:love " + (r_time + 5) + "s ease;animation:love " + (r_time + 5) + "s ease'></div>");


}, 500);

var i = 0;
var txt1 = "Hi SweetHeart.....!  <<               Now I wan't to say something special to you. <<<                So , Please read everything carefully...!                                                                           > When I saw you for the first time < You seems something Special to me.  <<                  As the days goes < you get closer to me....! <<                           I don't know the reason why your thoughts always resonates inside my mind...!                                                     > Everything about you is always intresting for me...!                   <<  I Love my Parents so much than anything else in this world....!                    << Now You are the only person  whom I love equally with my parents....!                                                             >I Love U <SweetHeart.....! |                  <<<< Give me One chance to Prove my Love ...!";
var speed = 50;
function typeWriter() {
    if (i < txt1.length) {
        if (txt1.charAt(i) == '<')
            document.getElementById("text1").innerHTML += '</br>'
        else if (txt1.charAt(i) == '>')
            document.getElementById("text1").innerHTML = ''
        else if (txt1.charAt(i) == '|') {
            $(".bg_heart").css("background-image", "url('data:image/jpeg;base64,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')");

        }
        else
            document.getElementById("text1").innerHTML += txt1.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
    }
}
// -------------------

// BEGIN AUDIOO PLAYER

$(function () {

    var audio = $("audio")[0];
    $('#opening_screen').on('click', function () {
        $('#opening_screen').addClass('roEdgeUpOut');

        $('.player_container').toggleClass('hidden roEdgeUpIn');
        //Play/pause the track
        if (audio.paused == false) {
            audio.pause();
            $('#btn-play-pause').children('i').removeClass('fa-pause');
            $('#btn-play-pause').children('i').addClass('fa-play');

        } else {
            typeWriter();
            audio.play();
            audio.volume = 0.5;
            $('#btn-play-pause').children('i').removeClass('fa-play');
            $('#btn-play-pause').children('i').addClass('fa-pause');
        }
    });

    $('#btn-play-pause').on('click', function () {
        //Play/pause the track
        if (audio.paused == false) {
            audio.pause();
            $(this).children('i').removeClass('fa-pause');
            $(this).children('i').addClass('fa-play');
        } else {
            audio.play();
            $(this).children('i').removeClass('fa-play');
            $(this).children('i').addClass('fa-pause');
        }
    });

    $('#btn-stop').on('click', function () {
        //Stop the track
        audio.pause();
        audio.currentTime = 0;
        $('#btn-play-pause').children('i').removeClass('fa-pause');
        $('#btn-play-pause').children('i').addClass('fa-play');
    });

    $('#btn-mute').on('click', function () {
        //Mutes/unmutes the sound
        if (audio.volume != 0) {
            audio.volume = 0;
            $(this).children('i').removeClass('fa-volume-off');
            $(this).children('i').addClass('fa-volume-up');
        } else {
            audio.volume = 1;
            $(this).children('i').removeClass('fa-volume-up');
            $(this).children('i').addClass('fa-volume-off');
        }
    });
    let loopCount =0;
    function updateProgress() {
        //Updates the progress bar
        var progress = document.getElementById("progress");
        var value = 0;
       
        if (audio.currentTime > 0) {
            value = Math.floor((100 / audio.duration) * audio.currentTime);
        }
        progress.style.width = value + "%";
        if (audio.currentTime == 0){
            loopCount = ++loopCount;
        }
        if (loopCount == 2)
            audio.pause();
    }

    //Progress Bar event listener
    audio.addEventListener("timeupdate", updateProgress, false);

});
  // END AUDIOO PLAYER

