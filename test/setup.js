import chai from "chai";
import dirtyChai from "dirty-chai";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";
import sinon from "sinon";
import Chance from "chance";

chai.use(sinonChai);
chai.use(chaiAsPromised);
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
