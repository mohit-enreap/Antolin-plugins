import prepareOfferData from './offerDataPreparer.js';
import prepareCADData from './cadDataPreparer.js';
import prepareIndustData from './industDataPreparer.js';

import prepareCAEData from './caeDataPreparer.js';

import preparePSData from './psDataPreparer.js';

import { sharedRef } from '../shared/sharedStore.js';
import { FEASIBILITY_CONSTANT } from "../CAD Product/data/feasibilityPercentage/feasibilityPercentage.js";

// The main function to prepare the data for integration
// This function will call the respective preparer functions for CAD, CAE & PS data 
// and structure the final data in the required format for Work Order tool integration
export default function prepareDataForIntegration(data, issueData, productType) {

    if (productType === "CAD") {
        const feasibility = data.Global.Feasibility;
        const hoursPerWeek = sharedRef.hoursPerWeek

        console.log("QUOT - WO | Hours per week : ", hoursPerWeek)

        console.log("PROTO DE: ", sharedRef.cadDE.protoDE, "\nSERIE DE: ", sharedRef.cadDE.serieDE)

        console.log("QUOT-WO Integration | \nFeasibility: ", feasibility, "\nFeasibility Constant: ", FEASIBILITY_CONSTANT[feasibility]);

        // Assuming data is an array of objects
        const rawOfferData = data.phaseFlags.phase_0 ? {
            offerData: data.offerData,
            percentages: data.percentages,
            dmData: data.dmData,
            product: data.Global.product,
            hoursPerWeek: hoursPerWeek,
            weeks: data.phaseDates.phase_0.weeks,
            feasibility: feasibility,
            feasibilityConstant: FEASIBILITY_CONSTANT[feasibility].Phase0
        } : {};

        const rawIndustData = data.phaseFlags.phase_3_4 ? {
            industrializationData: data.industrializationData,
            weeks: data.phaseDates.phase_3_4.weeks,
            product: data.Global.product,
            hoursPerWeek: hoursPerWeek,
            feasibility: feasibility,
            feasibilityConstant: FEASIBILITY_CONSTANT[feasibility].Phase3_4
        } : {};

        const offerDefaultActivityData = {
            "activities": {
                "Offer | 3D modifications": {
                    "TDL": 0,
                    "COO": 0,
                    "DE": 0,
                    "standard": 0,
                    "total": 0,
                    "extraWorkLoop": 0,
                    "reWorkLoop": 0,
                    "standardLoop": 0,
                    "checked": false,
                    "order": "101"
                },
                "Offer | Data Management": {
                    "TDL": 0,
                    "COO": 0,
                    "DE": 0,
                    "standard": 0,
                    "total": 0,
                    "extraWorkLoop": 0,
                    "reWorkLoop": 0,
                    "standardLoop": 0,
                    "checked": false,
                    "order": "102"
                }
            }
        }

        const offerData = data.phaseFlags.phase_0 ? prepareOfferData(rawOfferData) : offerDefaultActivityData;

        const cadData = prepareCADData(data.activities, data.Global, feasibility, FEASIBILITY_CONSTANT[feasibility].Phase1, FEASIBILITY_CONSTANT[feasibility].Phase2, sharedRef.cadDE.protoDE, sharedRef.cadDE.serieDE, data.phaseFlags.phase_1, data.phaseFlags.phase_2);

        const industData = data.phaseFlags.phase_3_4 ? prepareIndustData(rawIndustData) : {};

        const workOrderData = {
            Offer: offerData,
            activities: cadData,
            Industrialization: industData,
            Phases: data.phaseFlags,
            name: data.Global.product
        };

        console.log("Prepared Work Order Data:", JSON.stringify(workOrderData));

        return workOrderData;
    } else if (productType === "CAE") {
        const caeData = prepareCAEData(data["activities"], data["Global"])

        const workOrderData = {
            activities: caeData,
            name: issueData?.product + " - CAE"
        }
        return workOrderData;

    } else if (productType === "PS") {
        const psData = preparePSData(data["activities"],data["Global"])

        const workOrderData = {
            activities: psData,
            name: issueData?.product + " - PS"
        }
        return workOrderData;

    }
}