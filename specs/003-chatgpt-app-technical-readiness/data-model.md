# Data Model: ChatGPT Apps Technical Readiness

## ComplianceMetadata

Represents the policy/contact information required for marketplace compliance.

- **privacyPolicyUrl** (string, required): `https://gptapppoc.kieley.io/privacy`
- **supportContactUrl** (string, required): `https://gptapppoc.kieley.io/support`

## WidgetSecurityConfig

Represents widget security configuration embedded in the UI resource metadata.

- **widgetDomain** (string, required): `https://gptapppoc.kieley.io`
- **widgetCsp** (object, required):
  - **connect_domains** (string[], required): `["https://gptapppoc.kieley.io"]`
  - **resource_domains** (string[], optional): empty unless required
  - **frame_domains** (string[], optional): not used in this increment
