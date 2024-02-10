describe('Authentication', () => {
  it('Is running and redirects to sign in', () => {
    cy.visit('/');
    cy.url().should('include', '/signin');
    cy.contains('Sign In');
  });

  it('Allows users to sign up', () => {
    cy.fixture('signup').as('signup');

    cy.visit('/');
    cy.url().should('include', '/signin');
    cy.contains('Sign In');

    cy.visit('/signup');
    cy.contains('Sign Up');

    cy.get('#firstName').type('Time');
    cy.get('#firstName').should('have.value', 'Time');
    cy.get('#lastName').type('Traveler');
    cy.get('#lastName').should('have.value', 'Traveler');
    cy.get('#email').type('time.traveler@bogslife.com');
    cy.get('#email').should('have.value', 'time.traveler@bogslife.com');
    cy.get('#password').type('passWord!123');

    cy.findByRole('button', {name: /Sign Up/i}).click();

    cy.url().should('include', '/dashboard');

    cy.visit('/signout');
  });

  it('Allows registered users to sign in', () => {
    cy.visit('/');
    cy.url().should('include', '/signin');
    cy.contains('Sign In');

    cy.get('#email').type('time.traveler@bogslife.com');
    cy.get('#password').type('passWord!123');

    cy.findByRole('button', {name: /Sign In/i}).click();
    cy.url().should('include', '/dashboard');

    cy.visit('/signout');
  });
});