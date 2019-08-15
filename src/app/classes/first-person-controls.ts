import * as Three from "three";
import * as Cannon from "cannon";

export class FirstPersonControls {

    public object: any;
    public domElement: any;

    public enabled: boolean = false;
    public velocityFactor: number = 0.2;
    public eyeYPos: number = 2;
    public jumpVelocity: number = 6;

    public moveUp: boolean = false;
    public moveDown: boolean = false;
    public moveForward: boolean = false;
    public moveBackward: boolean = false;
    public moveLeft: boolean = false;
    public moveRight: boolean = false;
    public canJump: boolean = false;

    public raycaster: Three.Raycaster;

    public pitchObject: Three.Object3D;
    public yawObject: Three.Object3D;
    
    public inputVelocity: Three.Vector3;
    public euler: Three.Euler;
    public velocity: Three.Vector3 = new Three.Vector3();
    public direction: Three.Vector3 = new Three.Vector3();

    public body: Cannon.Body;
    public contactNormal: Cannon.Vec3 = new Cannon.Vec3();
    public quat: Three.Quaternion = new Three.Quaternion();

    constructor(object, body) {
        this.object = object;
        this.body = body;

        this.body.addEventListener("collide",(e) => {
            var contact = e.contact;
            var upAxis = new Cannon.Vec3(0,1,0);
            // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
            // We do not yet know which one is which! Let's check.
            if(contact.bi.id == this.body.id)  // bi is the player body, flip the contact normal
                contact.ni.negate(this.contactNormal);
            else
            this.contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is
    
            // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
            if(this.contactNormal.dot(upAxis) > 0.5) // Use a "good" threshold value between 0 and 1 here!
                this.canJump = true;
        });

        this.object.rotation.set(0, 0, 0);
    
        this.pitchObject = new Three.Object3D();
        this.pitchObject.add(this.object);
    
        this.yawObject = new Three.Object3D();
        this.yawObject.position.y = 2;
        this.yawObject.add(this.pitchObject);

        this.quat = new Three.Quaternion();

        document.addEventListener('mousemove', this.onMouseMove.bind(this), false);

        document.addEventListener('keydown', this.onKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onKeyUp.bind(this), false);

        this.raycaster = new Three.Raycaster(new Three.Vector3(), new Three.Vector3(0, -1, 0), 0, 10);
    }

    getObject() {

		return this.yawObject;

    }
    
    getDirection(targetVector) {

        targetVector.set(0,0,-1);
        this.quat.multiplyVector3(targetVector);
	}
    
    onMouseMove(event) {

        if ( this.enabled === false ) return;

        var PI_2 = Math.PI / 2;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        this.yawObject.rotation.y -= movementX * 0.002;
        this.pitchObject.rotation.x -= movementY * 0.002;

        this.pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, this.pitchObject.rotation.x ) );

	}

    onKeyDown(event) {

        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                this.moveForward = true;
                break;

            case 37: // left
            case 65: // a
            this.moveLeft = true; break;

            case 40: // down
            case 83: // s
            this.moveBackward = true;
                break;

            case 39: // right
            case 68: // d
            this.moveRight = true;
                break;

            case 32: // space
                if (this.canJump === true) this.body.velocity.y += this.jumpVelocity;
                this.canJump = false;
                break;

        }

    }
    
    onKeyUp(event) {

        switch(event.keyCode) {

            case 38: // up
            case 87: // w
                this.moveForward = false;
                break;

            case 37: // left
            case 65: // a
                this.moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                this.moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                this.moveRight = false;
                break;

        }

    }

    update(delta: number): void {
        if (!this.enabled)
            return;
            
        delta *= 10;

        this.velocity = new Three.Vector3(this.body.velocity.x, this.body.velocity.y,);

        this.inputVelocity = new Three.Vector3();
        this.euler = new Three.Euler();

        this.inputVelocity.set(0,0,0);
        let minVelocity: Three.Vector3 = new Three.Vector3(-5, -5, -5);
        let maxVelocity: Three.Vector3 = new Three.Vector3(5, 5, 5);

        console.log("Forward:", this.moveForward, "Backward:", this.moveBackward, "Left:", this.moveLeft, "Right:", this.moveRight)
        if ( this.moveForward ){
            this.inputVelocity.z = -maxVelocity.z;
        }
        if ( this.moveBackward ){
            this.inputVelocity.z = maxVelocity.z;
        }

        if ( this.moveLeft ){
            this.inputVelocity.x = -maxVelocity.x;
        }
        if ( this.moveRight ){
            this.inputVelocity.x = maxVelocity.x;
        }

        // Convert velocity to world coordinates
        this.euler.x = this.pitchObject.rotation.x;
        this.euler.y = this.yawObject.rotation.y;
        this.euler.order = "XYZ";
        this.quat.setFromEuler(this.euler);
        this.inputVelocity.applyQuaternion(this.quat);
        //quat.multiplyVector3(inputVelocity);

        // Add to the object
        this.body.velocity.x = this.inputVelocity.x;
        // this.body.velocity.x = this.body.velocity.x.clamp(minVelocity.x, maxVelocity.x);
        this.body.velocity.z = this.inputVelocity.z;
        // this.body.velocity.z = this.body.velocity.z.clamp(minVelocity.z, maxVelocity.z);
        // this.body.applyForce(new Cannon.Vec3(this.inputVelocity.x, this.inputVelocity.y, this.inputVelocity.z), this.body.position)

        this.yawObject.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
    }

	dispose() {

		document.removeEventListener( 'mousemove', this.onMouseMove, false );

	}

}

