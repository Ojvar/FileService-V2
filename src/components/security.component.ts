import {
  Application,
  bind,
  Binding,
  Component,
  CoreBindings,
  createBindingFromClass,
  inject,
} from '@loopback/core';
import {
  asSpecEnhancer,
  mergeOpenAPISpec,
  OASEnhancer,
  OpenApiSpec,
} from '@loopback/openapi-v3';
import {ReferenceObject, SecuritySchemeObject} from '@loopback/rest';

export class KCAuthenticationComponent implements Component {
  bindings: Binding[] = [createBindingFromClass(OpenAPISpecEnhancer)];

  constructor(@inject(CoreBindings.APPLICATION_INSTANCE) app: Application) {}
}

@bind(asSpecEnhancer)
export class OpenAPISpecEnhancer implements OASEnhancer {
  name = 'bearerAuth';

  modifySpec(spec: OpenApiSpec): OpenApiSpec {
    const patchSpec = {
      components: {securitySchemes: SECURITY_SCHEME_SPEC},
      security: OPERATION_SECURITY_SPEC,
    };

    return mergeOpenAPISpec(spec, patchSpec);
  }
}

export const SECURITY_SCHEME_SPEC: SecuritySchemeObjects = {
  // 'file-token': {
  //   type: 'apiKey',
  //   name: 'file-token',
  //   in: 'header',
  //   description: 'File request token should set into header',
  // },
  jwt: {type: 'http', scheme: 'bearer', bearerFormat: 'JWT'},
};

export type SecuritySchemeObjects = {
  [securityScheme: string]: SecuritySchemeObject | ReferenceObject;
};

// secure all endpoints with 'fileToken'
export const OPERATION_SECURITY_SPEC = [{jwt: []}];
// export const OPERATION_SECURITY_SPEC = [{'file-token': []}, {jwt: []}];
