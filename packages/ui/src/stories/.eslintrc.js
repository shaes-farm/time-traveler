module.exports = {
  extends: ["plugin:storybook/recommended"],
  overrides: [
    {
      rules: {
        "import/no-default-export": "off"
      }      
    }
  ]
};
