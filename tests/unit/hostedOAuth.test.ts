import { describe, expect, it } from "vitest";
import { buildAuthorizationServerMetadata, buildClientRegistrationResponse } from "../../src/helpers/hostedOAuth.js";

describe("hosted OAuth helpers", () => {
    it("builds authorization metadata for public Codex clients", () => {
        expect(
            buildAuthorizationServerMetadata({
                issuer: "https://dex.onfinance.ai/",
                publicBaseUrl: "https://mongo-analytics.mcp.onfinance.ai",
                registrationEnabled: true,
                tokenEndpointAuthMethods: ["none", "client_secret_basic"],
            })
        ).toMatchObject({
            issuer: "https://dex.onfinance.ai",
            authorization_endpoint: "https://dex.onfinance.ai/auth",
            token_endpoint: "https://dex.onfinance.ai/token",
            registration_endpoint: "https://mongo-analytics.mcp.onfinance.ai/oauth/register",
            token_endpoint_auth_methods_supported: ["none", "client_secret_basic"],
            code_challenge_methods_supported: ["S256"],
        });
    });

    it("returns a static public client registration for configured redirect URIs", () => {
        const result = buildClientRegistrationResponse(
            {
                redirect_uris: ["http://127.0.0.1:5555/callback"],
                scope: "openid email profile groups offline_access unknown",
            },
            {
                clientId: "mongo-analytics-mcp-codex",
                clientName: "Mongo Analytics MCP Codex",
                redirectUris: ["http://127.0.0.1:5555/callback", "http://localhost:5555/callback"],
                scopes: ["openid", "email", "profile", "groups", "offline_access"],
            }
        );

        expect(result.status).toBe(201);
        expect(result.response).toEqual({
            client_id: "mongo-analytics-mcp-codex",
            client_name: "Mongo Analytics MCP Codex",
            redirect_uris: ["http://127.0.0.1:5555/callback"],
            grant_types: ["authorization_code", "refresh_token"],
            response_types: ["code"],
            token_endpoint_auth_method: "none",
            scope: "openid email profile groups offline_access",
        });
    });

    it("rejects unconfigured redirect URIs", () => {
        const result = buildClientRegistrationResponse(
            { redirect_uris: ["http://127.0.0.1:7777/callback"] },
            {
                clientId: "mongo-analytics-mcp-codex",
                clientName: "Mongo Analytics MCP Codex",
                redirectUris: ["http://127.0.0.1:5555/callback"],
                scopes: ["openid"],
            }
        );

        expect(result.status).toBe(400);
        expect(result.response).toMatchObject({ error: "invalid_redirect_uri" });
    });
});
