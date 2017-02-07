import chai from "chai";
import dirtyChai from "dirty-chai";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";
import sinon from "sinon";
import Chance from "chance";
import chaiEventEmitter from "chai-eventemitter"
import log4js from "log4js"

log4js.configure({appenders:[]});

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiEventEmitter);
chai.use(dirtyChai);

function setup() {
    const sandbox = sinon.sandbox.create();

    afterEach(function () {
        sandbox.restore();
    });

    return {
        expect: chai.expect,
        should: chai.should(),
        chance: new Chance(),
        sandbox
    };
}

export default setup;
