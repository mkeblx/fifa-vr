/*
Game
*/

var Game = function(){
	this.scene;
	this.renderer;
	this.camera;

	this.ball;
	this.field = {
		w: 120,
		l: 80,
		h: 6
	};
	this.players = [];

	this.theta = 0;

	this.meshes = [];

	this.world;
	this.bodies = [];
};

Game.prototype.init = function(dist) {

	var renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapWidth = 2048;
	renderer.shadowMapHeight = 2048;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;
	renderer.setClearColor( 0xCCCCCC , 0);

	this.renderer = renderer;

	document.body.appendChild(this.renderer.domElement);


	this.scene = new THREE.Scene();
	this.scene.fog = new THREE.FogExp2( 0xCCCCCC , 0.002 );


	this.origDist = dist || 200;
	var camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.x = 0;
	camera.position.y = 40;
	camera.position.z = this.origDist;
	this.camera = camera;

	this.setupWorld();

	this.addLights();

	this.addFloor();

	this.addField();

	this.addFootball();

	this.addPlayers();

};

Game.prototype.addLights = function() {
	var light = new THREE.AmbientLight(0x404040);
	this.scene.add(light);

	var pointLight = new THREE.PointLight(0xFFFFFF);

	pointLight.position.x = 100;
	pointLight.position.y = 500;
	pointLight.position.z = 100;

	this.scene.add(pointLight);

	var dl = new THREE.DirectionalLight(0xFFFFFF);

	dl.position.x = 25;
	dl.position.y = 125;
	dl.position.z = 25;

	dl.shadowMapHeight = dl.shadowMapWidth = 1024*2;

	dl.shadowCameraLeft = -128;
	dl.shadowCameraRight = 128;
	dl.shadowCameraTop = 128;
	dl.shadowCameraBottom = -128;

	dl.castShadow = true;
	dl.shadowDarkness = 0.7;
	//dl.shadowCameraVisible = true;

	this.scene.add(dl);
}

Game.prototype.addFloor = function() {
	var floorMaterial = new THREE.MeshBasicMaterial({
		color: 0x999999,
		side: THREE.DoubleSide });

	var floorGeometry = new THREE.CircleGeometry( 30*200, 200, 0, Math.PI * 2 );

	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.rotation.x = 90*(Math.PI/180);
	floor.position.y = -11;
	floor.receiveShadow = false;

	this.scene.add(floor);

	var shadowGeo = new THREE.PlaneGeometry( this.field.w , this.field.l );
	var shadowMat = new THREE.MeshBasicMaterial({ color: '#333333' });
	var fShadow = new THREE.Mesh(shadowGeo, shadowMat);
	fShadow.rotation.x = -90*(Math.PI/180);
	fShadow.position.y = -10;

	this.scene.add(fShadow);
};

Game.prototype.addField = function() {
	var field = this.field;
	var geometry = new THREE.BoxGeometry( field.w, field.h, field.l );

	var fieldTexture = THREE.ImageUtils.loadTexture('textures/field.jpg');
	fieldTexture.anisotropy = this.renderer.getMaxAnisotropy();
	var fieldMat = new THREE.MeshPhongMaterial({ map: fieldTexture, color: "#999999" });

	var sideMat = new THREE.MeshPhongMaterial({ color: '#999999' });

	var materials = [
		sideMat,
		sideMat,
		fieldMat,
		new THREE.MeshPhongMaterial({ color: '#000000' }),
		sideMat,
		sideMat
	];
	
	var material = new THREE.MeshFaceMaterial( materials );

	mesh = new THREE.Mesh( geometry, material );
	mesh.receiveShadow = true;

	this.scene.add( mesh );
}

Game.prototype.addPlayers = function() {

	var per_team = 11;
	var num_bots = per_team*2;

	var mat = new THREE.MeshPhongMaterial({ color: "#ffff00" });
	var mat2 = new THREE.MeshPhongMaterial({ color: "#ff00ff" });

	var rand = function(dim) {
		return (Math.random()*dim - dim/2);
	};

	for (var i = 0; i < num_bots; i++) {
		var geo = new THREE.SphereGeometry(1.5, 16, 16);

		if (i == per_team)
			mat = mat2;

		var mesh = new THREE.Mesh(geo, mat);
		mesh.position.y = 5;
		var pos = this.randFieldPos();
		mesh.position.x = pos.x;
		mesh.position.z = pos.y;

		mesh.castShadow = true;

		this.scene.add(mesh);
		this.players.push(mesh);

		var b = new OIMO.Body({
			type: 'sphere',
			name: 'p_'+i,
			size: [2],
			pos: [pos.x,mesh.position.y,pos.y],
			move: true,
			world: this.world,
			config: [0.1, 5]});

		this.bodies.push(b.body);

		b.body.linearVelocity.x = rand(0.1);
		b.body.linearVelocity.y = 0;
		b.body.linearVelocity.z = rand(0.1);
		
		this.meshes.push(mesh);
	}
};

Game.prototype.addFootball = function() {
	var ballContainer = new THREE.Object3D();

	var r = 3;

	var texture = THREE.ImageUtils.loadTexture('textures/Football.jpg');
	var geometry = new THREE.SphereGeometry(r, 12, 12);
	var material = new THREE.MeshPhongMaterial({
		map: texture
	});
	var ball = new THREE.Mesh(geometry, material);

	ball.castShadow = true;

	this.ball = ball;

	ballContainer.position.y = 6;
	ballContainer.add(ball);

	var dir = new THREE.Vector3( 1, 0, 0 );
	var origin = new THREE.Vector3( 0, 0, 0 );
	var length = 10;
	var hex = 0xffff00;

	var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
	ballContainer.add(arrowHelper);

	this.scene.add(ballContainer);
	this.meshes.push(ballContainer);

	var b = new OIMO.Body({
		type: 'sphere',
		name: 'ball',
		size: [r],
		pos: [0,30,0],
		move: true,
		world: this.world,
		config: [5, 5]});

	this.bodies.push(b.body);

	b.body.linearVelocity.x = 0.05;
	b.body.linearVelocity.y = 0;
	b.body.linearVelocity.z = 0.1;
	//b.body.angularVelocity.x = 3;

	console.log(b);
};



Game.prototype.randFieldPos = function() {
	var randin = function(dim, pad) {
		pad = pad || 1;
		return (Math.random()*dim - dim/2) * pad;
	};

	var pos = {};
	pos.x = randin(this.field.w, 0.9);
	pos.y = randin(this.field.l, 0.9);
	return pos;
};

//physics
Game.prototype.setupWorld = function() {
	var world = new OIMO.World();
	var nG = 0;
	world.gravity = new OIMO.Vec3(0, -0.5, 0);

	var field = this.field;
	var ground = new OIMO.Body(
		{ size: [field.w, field.h, field.l],
			pos: [0,0,0],
			config: [1, 5],
			world: world});

	console.log(ground);

	var ground = new OIMO.Body({size:[300, 1, 300], pos:[0,-10,0], world: world});

	//walls
	var wH = 40;

	var size = [field.w,1,wH];
	var pos = [0,0,field.l/2];
	var rot = [90,0,0];
	var f = new OIMO.Body({
		size: size,
		pos: pos,
		rot: rot,
		world: world});
	this.addStaticBox(size, pos, rot);

	pos = [0,0,-field.l/2];
	var b = new OIMO.Body({
		size: size,
		pos: pos,
		rot: rot,
		world: world});
	this.addStaticBox(size, pos, rot);

	size = [wH,1,field.l];
	rot = [0,0,90];

	pos = [field.w/2,0,0];
	var r = new OIMO.Body({
		size: size,
		pos: pos,
		rot: rot,
		world: world});
	this.addStaticBox(size, pos, rot);

	pos = [-field.w/2,0,0];
	var l = new OIMO.Body({
		size: size,
		pos: pos,
		rot: rot,
		world: world});
	this.addStaticBox(size, pos, rot);

	this.world = world;
};

Game.prototype.addStaticBox = function(size, position, rotation) {
	return;
	var ToRad = Math.PI/180;
	var geo = new THREE.CubeGeometry(1,1,1);
	var mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: false, opacity: 0.5 });

	var mesh = new THREE.Mesh( geo, mat );
	mesh.scale.set( size[0], size[1], size[2] );
	mesh.position.set( position[0], position[1], position[2] );
	mesh.rotation.set( rotation[0]*ToRad, rotation[1]*ToRad, rotation[2]*ToRad );
	this.scene.add( mesh );
};

Game.prototype.onWindowResize = function() {
	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( window.innerWidth, window.innerHeight );
};

Game.prototype.render = function(head) {
	
	if (started) {
		this.world.step();
	}

	this.theta += 0.004;


	var p, r, m, x, y, z;
	var mtx = new THREE.Matrix4();
	var i = this.bodies.length;
	var mesh;

	while (i--) {
		mesh = this.meshes[i];

		if (!this.bodies[i].sleeping) {
				//console.log(this.bodies[i]);
				m = this.bodies[i].getMatrix();
				mtx.fromArray(m);
				mesh.position.setFromMatrixPosition( mtx );
				mesh.rotation.setFromRotationMatrix( mtx );

				// reset position
				if (m[13] < -100 && false) {
						x = -100 + Math.random()*200;
						z = -100 + Math.random()*200;
						y = 100 + Math.random()*1000;
						this.bodies[i].setPosition(x,y,z);
				}
		} else {
		
		}
	}


	var ratio = head.z/this.origDist;

	var camDist = (this.origDist + (head.z - initial.z)* 3).clamp(50, this.origDist*1.3);

	var camera = this.camera;
	
	if (webcamReady && started) {
		camera.position.x = camDist * Math.sin(this.theta);// (head.x - initial.x) * 4;
		camera.position.y = 40 + (head.y - initial.y);
		camera.position.z = camDist * Math.cos(this.theta);
		//_cc.position = cc.position;

		camera.rotation.z = Math.PI/2 - head.angle/2;
	}
	
	camera.lookAt(this.scene.position);

	this.renderer.render( this.scene, this.camera );
}
