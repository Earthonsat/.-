// -- ISS TLE datas
///
var deg2rad = Math.PI / 360;
var now = new Date();
var latitude, longitude, height;
/// ===============================================================================
var tle1 = '1 25544U 98067A   16232.15373916  .00004021  00000-0  65765-4 0  9999',
    tle2 = '2 25544  51.6448 103.8256 0002084 143.7454   0.7736 15.55053489 14785';
/// ===============================================================================

// -- calculates ISS coordinates
function updateISS()
{
  console.log("Updating ISS position");
  var satrec = satellite.twoline2satrec(tle1,tle2);
  console.log("satrec error: " + satrec.error);
  ///
  if(satrec.error == 0)
  {
    now = new Date();
    var pv = satellite.propagate(satrec,now.getUTCFullYear(),now.getUTCMonth()+1,now.getUTCDate(),now.getUTCHours(),now.getUTCMinutes(),now.getUTCSeconds());
    var positionEci = pv.position,
        velocityEci = pv.velocity;
    ///
    var gmst = satellite.gstimeFromDate(now.getUTCFullYear(),now.getUTCMonth()+1,now.getUTCDate(),now.getUTCHours(),now.getUTCMinutes(),now.getUTCSeconds());
    ///
    /*var observerGd = {
        longitude: -122.0308 * deg2rad,
        latitude: 36.9613422 * deg2rad,
        height: 0.370
      };*/
    ///
    //var positionEcf = satellite.eciToEcf(positionEci,gmst);
    //var observerEcf = satellite.geodeticToEcf(observerGd);
    var positionGd = satellite.eciToGeodetic(positionEci,gmst);
    ///
    /*var satX = positionEci.x,
        satY = positionEci.y,
        satZ = positionEci.z;*/
    ///
    longitude = positionGd.longitude; // RAD
    latitude = positionGd.latitude; // RAD
    height = positionGd.height;
    ///
    var longStr = satellite.degreesLong(longitude), // DEG
        latStr  = satellite.degreesLat(latitude); // DEG
    ///
    console.log("---");
    console.log("lat: " + latStr);
    console.log("long: " + longStr);
    console.log("height: " + height);
    console.log("---");

    // -- update 3D coordinates
    updateCoords();
  }

  setTimeout(function(){ updateISS(); }, 30000);
}

// -- start ISS
updateISS();

// -- THREE.JS
var container;
var camera, scene, renderer;
var light, ambient;
var group, iss;
///
var issGroup;
var c1, c2, bridge, sp1, sp2;
var cg, bg, spg;
///
var starsGeom;
var starsMat;
var starsMesh;
///
var mouseX = 0, mouseY = 0;
var screenW = window.innerWidth;
var screenH = window.innerHeight;
var windowHalfX = screenW / 2;
var windowHalfY = screenH / 2;
///
var initOK = false;
///
init();
animate();
///
function init()
{
  container = document.getElementById('container');
	camera = new THREE.PerspectiveCamera( 60, screenW / screenH, 1, 2000 );
	camera.position.z = 500;
	scene = new THREE.Scene();
  group = new THREE.Group();
	scene.add( group );

  // -- stars
  starsGeom = new THREE.SphereGeometry(1000, 32, 32);
  starsMat = new THREE.MeshBasicMaterial();
  starsMat.map = THREE.ImageUtils.loadTexture('./galaxy_starfield.png'); // deprecated --> use THREE.TextureLoader
  starsMat.side = THREE.BackSide;
  starsMesh = new THREE.Mesh(starsGeom, starsMat);
  scene.add(starsMesh);

  // -- earth
  var loader = new THREE.TextureLoader();
	loader.load( 'earth_topo_nasa.jpg', function(texture)
  {
    var geometry = new THREE.SphereGeometry(200,20,20);
    //var geometry = new THREE.IcosahedronGeometry(200,1); // --> to test
		//var material = new THREE.MeshBasicMaterial(
    var material = new THREE.MeshPhongMaterial(
      {
        map:texture,
        overdraw:0.5,
        specular: 0x555555,
        shininess: 5/*,
        shading:THREE.FlatShading*/
      });
    material.bumpMap = THREE.ImageUtils.loadTexture('./earthbump1k.jpg');
    material.bumpScale = 10;
		var mesh = new THREE.Mesh(geometry, material);
		group.add(mesh);
	});

  // -- iss group
  issGroup = new THREE.Group();
  group.add(issGroup);

  // -- iss mesh
  var issMat = new THREE.MeshLambertMaterial ({
  	color: 0x999999,
		wireframe: false,
    side: THREE.DoubleSide,
		shading:THREE.FlatShading
	});

  var issPointMat = new THREE.MeshBasicMaterial ({
  	color: 0xFF0000,
		wireframe: false
	});

  // -- cylinder geometry
  cg = new THREE.CylinderGeometry(3,3,10,10);
  // -- bridge geometry
  bg = new THREE.CylinderGeometry(2,2,4,10);
  // -- solar panel geometry
  spg = new THREE.PlaneGeometry(5,35,10);

  // -- basic iss representation as a sphere
  var issGeometry = new THREE.SphereGeometry(2,4,4);
  iss = new THREE.Mesh(issGeometry, issPointMat);
  group.add(iss);

  // -- iss cylinder 1
  c1 = new THREE.Mesh(cg, issMat);
  c1.position.y = 7;
  issGroup.add(c1);

  // -- iss cylinder 2
  c2 = new THREE.Mesh(cg, issMat);
  c2.position.y = -7;
  issGroup.add(c2);

  // -- iss panel 1
  sp1 = new THREE.Mesh(spg, issMat);
  sp1.position.y = 7;
  sp1.rotation.x = 180 * deg2rad;
  sp1.rotation.y = 180 * deg2rad;
  issGroup.add(sp1);

  // -- iss panel 2
  sp2 = new THREE.Mesh(spg, issMat);
  sp2.position.y = -7;
  sp2.rotation.x = 180 * deg2rad;
  sp2.rotation.y = 180 * deg2rad;
  issGroup.add(sp2);

  // -- iss bridge
  bridge = new THREE.Mesh(bg, issMat);
  issGroup.add(bridge);

  // -- lights
  light = new THREE.DirectionalLight(0xffffff, .7);
	light.position.set(-300, 300, 300);
	light.castShadow = false;
  scene.add(light);
  ambient = new THREE.HemisphereLight(0xffffff, 0xffffff, .5);
  scene.add(ambient);

  // -- init ok
  initOK = true;
  updateCoords();

  // -- renderer
  //renderer = new THREE.CanvasRenderer();
  renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
  renderer.setClearColor( 0xffffff );
  //renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( screenW, screenH );
  container.appendChild( renderer.domElement );

  // -- events
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  window.addEventListener( 'resize', onWindowResize, false );
}

// -- update ISS 3D coordinates
function updateCoords()
{
  if(initOK == true)
  {
    console.log("--> updating coordinates");

    var R = 200;
    iss.position.x = (R * Math.cos(latitude) * Math.cos(longitude));
    iss.position.z = (R * Math.cos(latitude) * Math.sin(longitude)) * -1;
    iss.position.y = (R * Math.sin(latitude));

    var R2 = 250;
    issGroup.position.x = (R2 * Math.cos(latitude) * Math.cos(longitude));
    issGroup.position.z = (R2 * Math.cos(latitude) * Math.sin(longitude)) * -1;
    issGroup.position.y = (R2 * Math.sin(latitude));
  }
}

// -- WINDOW RESIZE EVENT
function onWindowResize()
{
  windowHalfX = screenW / 2;
  windowHalfY = screenH / 2;

  camera.aspect = screenW / screenH;
	camera.updateProjectionMatrix();

	renderer.setSize( screenW, screenH );
}

// -- MOUSE MOVE EVENT
function onDocumentMouseMove( event )
{
  mouseX = ( event.clientX - windowHalfX );
	mouseY = ( event.clientY - windowHalfY );
}

// -- ANIMATE
function animate()
{
  requestAnimationFrame( animate );
  render();
}

// -- RENDER
function render()
{
  camera.position.x += ( mouseX - camera.position.x ) * 0.05;
	camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
	camera.lookAt( scene.position );

	group.rotation.y -= 0.005;

	renderer.render( scene, camera );
}
