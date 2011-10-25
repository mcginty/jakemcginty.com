var delta = [ 0, 0 ];
var stage = [ window.screenX, window.screenY, window.innerWidth, window.innerHeight ];
getBrowserDimensions();

var isRunning = false;
var isMouseDown = false;

var worldAABB;
var world;
var iterations = 1;
var timeStep = 1 / 25;

var walls = [];
var wall_thickness = 400;
var wallsSetted = false;

var mouseJoint;
var mouse = { x: 0, y: 0 };

var mouseOnClick = [];

var elements = [];
var bodies = [];
var bodyJoints = [];
var properties = [];
var balloon_counter = 0;
var balloon_spacing = 200; //px

var query, page = 0;

var resultBodies = [];

var gravity = { x: 0, y: 1 };

init();
run();
function init() {

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    // document.ondblclick = onDocumentDoubleClick;

    document.addEventListener( 'keyup', onDocumentKeyUp, false );


    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', onDocumentTouchMove, false );
    document.addEventListener( 'touchend', onDocumentTouchEnd, false );

    window.addEventListener( 'deviceorientation', onWindowDeviceOrientation, false );

    // init box2d

    worldAABB = new b2AABB();
    worldAABB.minVertex.Set( - 200, - 200 );
    worldAABB.maxVertex.Set( window.innerWidth + 200, window.innerHeight + 200 );

    world = new b2World( worldAABB, new b2Vec2( 0, 0 ), true );

    // walls
    setWalls();

    // Get box2d elements
    var total_balloons = getElementsByClass("balloon").length;
    elements = getElementsByClass("box2d");

    for ( var i = 0; i < elements.length; i ++ ) {

        properties[i] = getElementProperties( elements[i] );

    }

    for ( var i = 0; i < elements.length; i ++ ) {

        var element = elements[ i ];
        element.style.position = 'absolute';
        element.style.left = properties[i][0] + 'px';
        element.style.top = properties[i][1] + 'px';
        element.style.width = properties[i][2] + 'px';
        element.addEventListener( 'mousedown', onElementMouseDown, false );
        element.addEventListener( 'mouseup', onElementMouseUp, false );
        element.addEventListener( 'click', onElementClick, false );

        if (element.className.indexOf("balloon") != -1) {
            //bodies[i] = blowUpBalloon( world,properties[i][0] + (properties[i][2] >> 1), properties[i][1] + (properties[i][3] >> 1), properties[i][2] / 2, properties[i][3] / 2, element.className.indexOf("fixed") != -1 );
            bodies[i] = blowUpBalloon( world, window.innerWidth/2-((total_balloons-1)*balloon_spacing/2)+(balloon_counter*balloon_spacing), window.innerHeight/2, properties[i][2] / 2, properties[i][3] / 2, element.className.indexOf("fixed") != -1 );
            balloon_counter = balloon_counter + 1;
        }
        else {
            bodies[i] = createBox( world, properties[i][0] + (properties[i][2] >> 1), properties[i][1] + (properties[i][3] >> 1), properties[i][2] / 2, properties[i][3] / 2, element.className.indexOf("fixed") != -1 );
            bodies[i].joints = [];
            var md_left = new b2MouseJointDef();
            md_left.body1 = world.m_groundBody;
            md_left.body2 = bodies[i];
            md_left.target.Set(properties[i][0], properties[i][1]);
            md_left.maxForce = 30000.0 * bodies[i].m_mass;
            md_left.timeStep = timeStep;
            var md_right = new b2MouseJointDef();
            md_right.body1 = world.m_groundBody;
            md_right.body2 = bodies[i];
            md_right.frequencyHz = 1.0;
            md_right.target.Set(properties[i][0]+properties[i][2], properties[i][1]);
            md_right.maxForce = 30000.0 * bodies[i].m_mass;
            md_right.timeStep = timeStep;
            bodies[i].joints[0] = world.CreateJoint(md_left);
            bodies[i].joints[1] = world.CreateJoint(md_right);
        }
    }

}

function run() {

    isRunning = true;
    setInterval( loop, 15 );

}

//

function onDocumentMouseDown( event ) {

    isMouseDown = true;

}

function onDocumentMouseUp( event ) {

    isMouseDown = false;

}

function onDocumentMouseMove( event ) {

    //if ( !isRunning ) run();

    mouse.x = event.clientX;
    mouse.y = event.clientY;

}

function onDocumentKeyUp( event ) {

}

function onDocumentTouchStart( event ) {

    if ( event.touches.length == 1 ) {

        if ( !isRunning ) {

            run();

        }

        mouse.x = event.touches[0].pageX;
        mouse.y = event.touches[0].pageY;
        isMouseDown = true;
    }
}

function onDocumentTouchMove( event ) {

    if ( event.touches.length == 1 ) {

        event.preventDefault();

        mouse.x = event.touches[0].pageX;
        mouse.y = event.touches[0].pageY;

    }

}

function onDocumentTouchEnd( event ) {

    if ( event.touches.length == 0 ) {

        isMouseDown = false;
    }

}

function onWindowDeviceOrientation( event ) {

    if ( event.beta ) {

        gravity.x = Math.sin( event.gamma * Math.PI / 180 );
        gravity.y = Math.sin( ( Math.PI / 4 ) + event.beta * Math.PI / 180 );

    }

}

//

function onElementMouseDown( event ) {

    event.preventDefault();

    mouseOnClick[0] = event.clientX;
    mouseOnClick[1] = event.clientY;

}

function onElementMouseUp( event ) {

    event.preventDefault();

}

function onElementClick( event ) {

    var range = 5;



    if ( mouseOnClick[0] > event.clientX + range || mouseOnClick[0] < event.clientX - range &&
        mouseOnClick[1] > event.clientY + range || mouseOnClick[1] < event.clientY - range ) {
        console.log('preventing default action');
        event.preventDefault();

    }

}

function loop() {

    if (getBrowserDimensions())
        setWalls();

    delta[1] += (0 - delta[1]) * .5;

    world.m_gravity.y = gravity.y * 350 + delta[1];

    mouseDrag();
    world.Step(timeStep, iterations);

    for ( i = 0; i < elements.length; i++ ) {

        var body = bodies[i];
        if (body.userData['balloon']) {
            body.ApplyForce(new b2Vec2(0.0, -400 * body.m_mass), body.m_position );
            body.anchor.element.style.left = (body.anchor.m_position0.x - 25)  + 'px';
            body.anchor.element.style.top = (body.anchor.m_position0.y - 25) + 'px';
            for ( j = 0; j < body.elbows.length; j++ ) {
                body.elbows[j].element.style.left = (body.elbows[j].m_position0.x - 5) + 'px';
                body.elbows[j].element.style.top =  (body.elbows[j].m_position0.y - 5) + 'px';
            }
        }
        var element = elements[i];

        element.style.left = (body.m_position0.x - (properties[i][2] >> 1)) + 'px';
        element.style.top = (body.m_position0.y - (properties[i][3] >> 1)) + 'px';

        var style = 'rotate(' + (body.m_rotation0 * 57.2957795) + 'deg)';

        element.style.transform = style;
        element.style.WebkitTransform = style + ' translateZ(0)'; // Force HW Acceleration
        element.style.MozTransform = style;
        element.style.OTransform = style;
        element.style.msTransform = style;
    }
}


// .. BOX2D UTILS

function createBox(world, x, y, width, height, fixed, element) {

    if (typeof(fixed) == 'undefined')
        fixed = true;

    var boxSd = new b2BoxDef();

    if (!fixed)
        boxSd.density = 1.0;

    boxSd.extents.Set(width, height);

    var boxBd = new b2BodyDef();
    boxBd.AddShape(boxSd);
    boxBd.position.Set(x,y);

    var body = world.CreateBody(boxBd)
    body.userData = {balloon: false};

    return body;
}

function blowUpBalloon(world, x, y, width, height, fixed, element) {
    var links = 5;
    var rope_length = 200;

    if (typeof(fixed) == 'undefined')
        fixed = true;

    var boxSd = new b2BoxDef();

    if (!fixed)
        boxSd.density = 1.0;

    boxSd.extents.Set(width, height);

    var boxBd = new b2BodyDef();
    boxBd.AddShape(boxSd);
    boxBd.position.Set(x,y);

    var body = world.CreateBody(boxBd);
    body.elbows = []

    /* Heavy Anchor */
      // HTML insertion
    anchorElement = document.createElement('div');
    anchorElement.className = 'balloon_anchor';
    anchorElement.style.background = 'rgba(255,255,255,0.5)';
    document.getElementById('container').appendChild(anchorElement);
      // Box2d jazz
    var anchorBox = new b2BoxDef();
    anchorBox.density = 100.0;
    anchorBox.extents.Set(50, 50);
    var anchorBody = new b2BodyDef();
    anchorBody.AddShape(anchorBox);
    anchorBody.position.Set(x,y+rope_length);
    var anchor = world.CreateBody(anchorBody);

    var link = anchor;
    for (var i=1; i<=links; i++) {
        elbowElement = document.createElement('div');
        elbowElement.className = 'balloon_elbow';
        elbowElement.style.background = 'rgba(255,255,255,0.5)';
        document.getElementById('container').appendChild(elbowElement);

        /* Elbow Joint */
        var elbowBox = new b2BoxDef();
        elbowBox.density = 0.5;
        elbowBox.extents.Set(10, 10);
        var elbowBody = new b2BodyDef();
        elbowBody.AddShape(elbowBox);
        elbowBody.position.Set(x,y+rope_length-(rope_length/(links+1))*i);
        var elbow = world.CreateBody(elbowBody);
        elbow.element = elbowElement;
        body.elbows[i-1] = elbow;

        /* Rope. Link it to the previous elbow known as 'link'. */
        var elbowHardwire = new b2DistanceJointDef();
        elbowHardwire.body1 = link;
        elbowHardwire.body2 = elbow;
        elbowHardwire.anchorPoint1.Set( x, y+rope_length-(rope_length/(links+1))*(i-1) );
        elbowHardwire.anchorPoint2.Set( x, y+rope_length-(rope_length/(links+1))*i );
        worldElbowHardwire = world.CreateJoint(elbowHardwire);

        link = elbow;
    }
    var elbowBodyString = new b2DistanceJointDef();
    elbowBodyString.body1 = link;
    elbowBodyString.body2 = body;
    elbowBodyString.anchorPoint1.Set( x, y+rope_length/links );
    elbowBodyString.anchorPoint2.Set( x, y+height/2 );
    worldElbowBodyString = world.CreateJoint(elbowBodyString);
    anchor.element = anchorElement;
    body.anchor = anchor;
    body.userData = { balloon: true };
    return body;
}

function mouseDrag() {

    // mouse press
    if (isMouseDown && !mouseJoint) {

        var body = getBodyAtMouse();
        if (body) {
            if (!body.userData.balloon) {
                if (body.joints[0] != null) {
                    world.DestroyJoint(body.joints[0]);
                    body.joints[0] = null;
                }
                else if (body.joints[1] != null) {
                    world.DestroyJoint(body.joints[1]);
                    body.joints[1] = null;
                }
            }

            var md = new b2MouseJointDef();
            md.body1 = world.m_groundBody;
            md.body2 = body;
            md.target.Set(mouse.x, mouse.y);
            md.maxForce = 30000.0 * body.m_mass;
            md.timeStep = timeStep;
            mouseJoint = world.CreateJoint(md);
            body.WakeUp();
        }
    }

    // mouse release
    if (!isMouseDown) {

        if (mouseJoint) {

            world.DestroyJoint(mouseJoint);
            mouseJoint = null;
        }
    }

    // mouse move
    if (mouseJoint) {

        var p2 = new b2Vec2(mouse.x, mouse.y);
        mouseJoint.SetTarget(p2);
    }
}

function getBodyAtMouse() {

    // Make a small box.
    var mousePVec = new b2Vec2();
    mousePVec.Set(mouse.x, mouse.y);

    var aabb = new b2AABB();
    aabb.minVertex.Set(mouse.x - 1, mouse.y - 1);
    aabb.maxVertex.Set(mouse.x + 1, mouse.y + 1);

    // Query the world for overlapping shapes.
    var k_maxCount = 10;
    var shapes = [];
    var count = world.Query(aabb, shapes, k_maxCount);
    var body = null;

    for ( var i = 0; i < count; i ++ ) {

        //if (shapes[i].m_body.IsStatic() == false) {

            if ( shapes[i].TestPoint(mousePVec) ) {

                body = shapes[i].m_body;
                break;
            }
       // }
    }
    return body;
}

function setWalls() {

    if (wallsSetted) {

        world.DestroyBody(walls[0]);
        world.DestroyBody(walls[1]);
        world.DestroyBody(walls[2]);
        world.DestroyBody(walls[3]);

        walls[0] = null; 
        walls[1] = null;
        walls[2] = null;
        walls[3] = null;
    }

    walls[0] = createBox(world, stage[2] / 2, - wall_thickness, stage[2], wall_thickness);
    walls[1] = createBox(world, stage[2] / 2, stage[3] + wall_thickness, stage[2], wall_thickness);
    walls[2] = createBox(world, - wall_thickness, stage[3] / 2, wall_thickness, stage[3]);
    walls[3] = createBox(world, stage[2] + wall_thickness, stage[3] / 2, wall_thickness, stage[3]);    

    wallsSetted = true;

}

// .. UTILS

function getElementsByClass( searchClass ) {

    var classElements = [];
    var els = document.getElementsByTagName('*');
    var elsLen = els.length

    for (i = 0, j = 0; i < elsLen; i++) {

        var classes = els[i].className.split(' ');
        for (k = 0; k < classes.length; k++)
            if ( classes[k] == searchClass )
                classElements[j++] = els[i];
            }

            return classElements;
}

function getElementProperties( element ) {

    var x = 0;
    var y = 0;
    var width = element.offsetWidth;
    var height = element.offsetHeight;

    do {

        x += element.offsetLeft;
        y += element.offsetTop;

    } while ( element = element.offsetParent );

    return [ x, y, width, height ];
}

function getBrowserDimensions() {

    var changed = false;

    if ( stage[0] != window.screenX ) {

        delta[0] = (window.screenX - stage[0]) * 50;
        stage[0] = window.screenX;
        changed = true;
    }

    if ( stage[1] != window.screenY ) {

        delta[1] = (window.screenY - stage[1]) * 50;
        stage[1] = window.screenY;
        changed = true;
    }

    if ( stage[2] != window.innerWidth ) {

        stage[2] = window.innerWidth;
        changed = true;
    }

    if ( stage[3] != window.innerHeight ) {

        stage[3] = window.innerHeight;
        changed = true;
    }

    return changed;
}

