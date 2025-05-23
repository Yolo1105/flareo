package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

func init() {
	// Initialize OAuth configuration for tests
	oauthConfig = &oauth2.Config{
		ClientID:     "test-client-id",
		ClientSecret: "test-client-secret",
		RedirectURL:  "http://localhost:8080/auth/google/callback",
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}
}

func TestGoogleLoginHandler(t *testing.T) {
	req, err := http.NewRequest("GET", "/auth/google", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(GoogleLoginHandler)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusTemporaryRedirect {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusTemporaryRedirect)
	}
}

func TestGoogleCallbackHandler(t *testing.T) {
	req, err := http.NewRequest("GET", "/auth/google/callback?code=test-code", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(GoogleCallbackHandler)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusInternalServerError {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusInternalServerError)
	}
} 