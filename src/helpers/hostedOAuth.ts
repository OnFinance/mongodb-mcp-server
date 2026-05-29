export type HostedOAuthMetadataConfig = {
    issuer?: string;
    publicBaseUrl: string;
    registrationEnabled: boolean;
    tokenEndpointAuthMethods: string[];
};

export type HostedOAuthRegistrationConfig = {
    clientId?: string;
    clientName: string;
    redirectUris: string[];
    scopes: string[];
};

export function buildAuthorizationServerMetadata(config: HostedOAuthMetadataConfig): Record<string, unknown> {
    const issuer = config.issuer?.replace(/\/$/, "") ?? "";
    const metadata: Record<string, unknown> = {
        issuer,
        authorization_endpoint: `${issuer}/auth`,
        token_endpoint: `${issuer}/token`,
        jwks_uri: `${issuer}/keys`,
        userinfo_endpoint: `${issuer}/userinfo`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        token_endpoint_auth_methods_supported: config.tokenEndpointAuthMethods,
        code_challenge_methods_supported: ["S256"],
        scopes_supported: ["openid", "email", "profile", "groups", "offline_access"],
    };

    if (config.registrationEnabled) {
        metadata.registration_endpoint = `${config.publicBaseUrl.replace(/\/$/, "")}/oauth/register`;
    }

    return metadata;
}

export function buildClientRegistrationResponse(
    body: unknown,
    config: HostedOAuthRegistrationConfig
): { status: number; response: Record<string, unknown> } {
    if (!config.clientId) {
        return {
            status: 400,
            response: { error: "invalid_client_metadata", error_description: "client id is not configured" },
        };
    }

    const requestedRedirectUris =
        isRecord(body) && Array.isArray(body.redirect_uris)
            ? body.redirect_uris.filter((uri): uri is string => typeof uri === "string")
            : [];
    const redirectUris = requestedRedirectUris.length ? requestedRedirectUris : config.redirectUris;
    const invalidRedirectUris = redirectUris.filter((uri) => !config.redirectUris.includes(uri));
    if (!redirectUris.length || invalidRedirectUris.length) {
        return {
            status: 400,
            response: {
                error: "invalid_redirect_uri",
                error_description: "requested redirect_uris must exactly match configured Codex callback URIs",
            },
        };
    }

    const requestedScopes =
        isRecord(body) && typeof body.scope === "string"
            ? body.scope
                  .split(/\s+/)
                  .map((scope) => scope.trim())
                  .filter(Boolean)
            : config.scopes;
    const scopes = requestedScopes.filter((scope) => config.scopes.includes(scope));

    return {
        status: 201,
        response: {
            client_id: config.clientId,
            client_name: config.clientName,
            redirect_uris: redirectUris,
            grant_types: ["authorization_code", "refresh_token"],
            response_types: ["code"],
            token_endpoint_auth_method: "none",
            scope: scopes.join(" "),
        },
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
