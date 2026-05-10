describe("booking detail", () => {
  it("shows segment fare families", () => {
    cy.visit("/booking/DEMO-1942");

    cy.contains("Booking DEMO-1942");
    cy.contains("Fare family: Economy");
    cy.contains("Fare family: Flex");
  });
});
