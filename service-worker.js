chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: [1],
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "x-test-header",
            operation: "set",
            value: "my custom header"
          }
        ]
      },
      condition: {
        urlFilter: "*"
      }
    }
  ]
});
