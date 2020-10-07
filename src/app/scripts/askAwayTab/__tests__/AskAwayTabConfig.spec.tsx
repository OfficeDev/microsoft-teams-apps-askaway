import * as React from "react";
import { shallow } from "enzyme";
import toJson from "enzyme-to-json";
import { Header } from "@fluentui/react-northstar";

import { AskAwayTabConfig } from "../AskAwayTabConfig";

describe("AskAwayTabConfig Component", () => {
    // Snapshot Test Sample
    it("should match the snapshot", () => {
        const wrapper = shallow(<AskAwayTabConfig />);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    // Component Test Sample
    it("should render the tab", () => {
        const component = shallow(<AskAwayTabConfig />);
        const divResult = component.containsMatchingElement(<Header content="Configure your tab" />);

        expect(divResult).toBeTruthy();
    });
});
