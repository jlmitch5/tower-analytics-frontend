/* global cy, Cypress, before */
import {
    dashboardUrl
} from './constants';

import moment from 'moment';
/* global cy, Cypress */
const appid = Cypress.env('appid');

const filterCategorySelector = '#pf-select-toggle-id-55';
const dateSelector = '#pf-select-toggle-id-59';
const orgSelector = '#pf-select-toggle-id-62';
const clusterSelector = '#pf-select-toggle-id-69';
const templateSelector = '#pf-select-toggle-id-76';
const jobTypeSelector = '#pf-select-toggle-id-58';

/*
    lifted from https://github.com/cypress-io/cypress/issues/1366#issuecomment-437878862; setting the value of a React controlled datetime input component via Cypress requires setting it on the prototype level of the native input HTML element itself
*/
const setDate = (input, value) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, value);

    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
};

async function fuzzClustersPage() {

    // open each top template modal and save a screenshot ...
    for (let i = 0; i <= 4; i++) {
        cy.get(appid).find('a').eq(i).click({ waitForAnimations: true }).then(() => {
            cy.screenshot('top-template-modal-' + i + '.png', { capture: 'fullPage' });
            cy.get('button[aria-label="Close"]').click({ waitForAnimations: true });
        });
    }

    // navigate to the job explorer page for each bar in the chart ...
    for (let i = 0; i <= 4; i++) {

        // pick a random bar to click on ...
        let barid = Math.floor(Math.random() * 10);
        cy.log(barid);

        // click it and wait for the jobexplorer page to load ...
        cy.get(appid).find('rect').eq(barid).click({ waitForAnimations: true });
        cy.screenshot('clusters-bar-' + barid + '-jobexplorer-details.png', { capture: 'fullPage' });

        // go back to the clusters page ...
        cy.visit(dashboardUrl);
    }

}

describe('Dashboard page smoketests', () => {
    before(() => {
        // open the cloud landing page ...
        cy.visit('/');

        // sso login ...
        cy.get('[data-ouia-component-id="1"]').click();
        cy.getUsername().then(uname => cy.get('#username').type(`${uname}{enter}`));
        cy.getPassword().then(password => cy.get('#password').type(`${password}{enter}`));
        cy.visit(dashboardUrl);
    });

    it('can interact with the clusters page without breaking the UI', () => {
        fuzzClustersPage();
    });
    it('Page contains chart, and 3 card elements', () => {
        cy.get('#d3-bar-chart-root').should((chartElem) => {
            expect(chartElem).to.have.length(1);
        });
        cy.get('div[class="dataCard"] > ul').should((cards) => {
            expect(cards).to.have.length(3);
        });
    });

    it('There is a filter toolbar on the Clusters page', () => {
        cy.get('div[id="filterable-toolbar-with-chip-groups"]').should(toolbar => {
            expect(toolbar).to.have.length(1);
        });
    });

    it('Can toggle different filters via the toolbar', () => {
        // toggling Orgs filter category updates available options
        cy.get(filterCategorySelector).click();
        cy.get('button[class="pf-c-select__menu-item"]').contains('Organization').click();
        cy.get('button[id^="pf-select-toggle-id-"]').contains('Filter by organization').should(secondaryDropdown => {
            expect(secondaryDropdown).to.have.length(1);
        });
        // toggling Clusters filter category updates available options
        cy.get(orgSelector).click();
        cy.get('button[class="pf-c-select__menu-item"]').contains('Cluster').click();
        cy.get('button[id^="pf-select-toggle-id-"]').contains('Filter by cluster').should(secondaryDropdown => {
            expect(secondaryDropdown).to.have.length(1);
        });
        // toggling Template filter category updates available options
        cy.get(clusterSelector).click();
        cy.get('button[class="pf-c-select__menu-item"]').contains('Template').click();
        cy.get('button[id^="pf-select-toggle-id-"]').contains('Filter by template').should(secondaryDropdown => {
            expect(secondaryDropdown).to.have.length(1);
        });
        // toggling Job filter category updates available options
        cy.get(templateSelector).click();
        cy.get('button[class="pf-c-select__menu-item"]').contains('Job').click();
        cy.get('button[id^="pf-select-toggle-id-"]').contains('Filter by job').should(secondaryDropdown => {
            expect(secondaryDropdown).to.have.length(1);
        });
    });

    it('Can filter by organization', () => {
        cy.get(filterCategorySelector).click();
        cy.get('button[class="pf-c-select__menu-item"]').contains('Organization').click();
        cy.get('button[id^="pf-select-toggle-id-"]').contains('Filter by organization').parent().parent().click();
        cy.get('div[class="pf-c-select__menu"]').find('span').contains('No organization').siblings('input').click();
        const screenshotFilename = 'clusters_filter_by_org.png';
        cy.screenshot(screenshotFilename);
    });

    it('Can filter by a preset date range', () => {
        cy.get(dateSelector).click();
        cy.get('.pf-c-select__menu-item').contains('Past 62 days').click();
        const screenshotFilename = 'clusters_filter_by_quickDateRange.png';
        cy.screenshot(screenshotFilename);
    });

    it('Can filter by a custom date range', () => {
        const today = moment(new Date().toISOString()).format('YYYY-MM-DD');
        const oneWeekAgo = moment(new Date().toISOString()).subtract(1, 'week').format('YYYY-MM-DD');

        cy.get(dateSelector).click();
        cy.get('.pf-c-select__menu-item').contains('Custom').click();
        cy.get('#startDate').then(input => setDate(input[0], oneWeekAgo));
        cy.get('#endDate').then(input => setDate(input[0], today));
        const screenshotFilename = 'clusters_filter_by_customDateRange';
        cy.screenshot(screenshotFilename);
    });
    it('Can filter by cluster', () => {
        cy.get(filterCategorySelector).click();
        cy.get('button[class="pf-c-select__menu-item"]').contains('Cluster').click();
        cy.get('button[id^="pf-select-toggle-id-"]').contains('Filter by cluster').parent().parent().click();
        cy.get('div[class="pf-c-select__menu"]').find('span').first().siblings('input').click();
        cy.get('#d3-line-chart-root > svg').then(chartElem => {
            expect(chartElem).to.have.length(1);
        });
        const screenshotFilename = 'clusters_filter_by_cluster.png';
        cy.screenshot(screenshotFilename);
    });
    it('Can filter by job type', () => {
        cy.get(jobTypeSelector).parent().parent().click();
        cy.get('div[class="pf-c-select__menu"]').find('span').contains('Workflow job').siblings('input').click();
        const screenshotFilename = 'clusters_filter_by_jobType.png';
        cy.screenshot(screenshotFilename);
    });
    it('Can filter by template', () => {
        cy.get(filterCategorySelector).click();
        cy.get('button[class="pf-c-select__menu-item"]').contains('Template').click();
        cy.get('button[id^="pf-select-toggle-id-"]').contains('Filter by template').parent().parent().click();
        cy.get('div[class="pf-c-select__menu"]').find('span').first().siblings('input').click();
        const screenshotFilename = 'clusters_filter_by_template.png';
        cy.screenshot(screenshotFilename);
    });
});
