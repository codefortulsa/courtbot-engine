import chai from "chai";
import dirtyChai from "dirty-chai";
import sinonChai from "sinon-chai";
import sinon from "sinon";
import Chance from "chance";

chai.use(sinonChai);
chai.use(dirtyChai);

function setup() {
    const sandbox = sinon.sandbox.create();

    afterEach(function () {
        sandbox.restore();
    });

    return {
        expect: chai.expect,
        chance: new Chance(),
        sandbox
    };
}

export default setup;
