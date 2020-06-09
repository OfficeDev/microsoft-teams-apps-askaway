import * as React from "react";
import { shallow } from "enzyme";
import toJson from "enzyme-to-json";

import { StartAmaMessageExtensionConfig } from "../StartAmaMessageExtensionConfig";

describe("StartAmaMessageExtensionConfig Component", () => {
    // Snapshot Test Sample
    it("should match the snapshot", () => {
        const wrapper = shallow(<StartAmaMessageExtensionConfig />);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    // Component Test Sample
    it("should render the tab", () => {
        const component = shallow(<StartAmaMessageExtensionConfig />);
        const divResult = component.containsMatchingElement(<div>Start AMA configuration</div>);

        expect(divResult).toBeTruthy();
    });
});


