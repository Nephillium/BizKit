export const CONTINUE_WITH_GOOGLE_LABEL = 'Continue with Google';

/**
 * Google Identity branding: white button, #747775 stroke, #1F1F1F Roboto Medium
 * label, and the color G mark. The label is the English string Google specifies.
 */
export function ContinueWithGoogle({ href }: { href: string }) {
  return (
    <>
      <style>{`
        .continue-with-google {
          align-items: center;
          background-color: #ffffff;
          border: 1px solid #747775;
          border-radius: 4px;
          box-sizing: border-box;
          color: #1f1f1f;
          cursor: pointer;
          display: flex;
          font-family: Roboto, arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
          height: 40px;
          letter-spacing: 0.25px;
          margin-bottom: 16px;
          padding: 0 12px;
          text-decoration: none;
          width: 100%;
        }
        .continue-with-google:hover { background-color: #f8f9fa; }
        .continue-with-google:focus-visible {
          outline: 2px solid #1f1f1f;
          outline-offset: 2px;
        }
        .continue-with-google-icon {
          flex: 0 0 20px;
          height: 20px;
          width: 20px;
        }
        .continue-with-google-label {
          flex: 1 1 auto;
          font-family: Roboto, arial, sans-serif;
          font-weight: 500;
          overflow: hidden;
          text-align: center;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
      <a className="continue-with-google" href={href} data-testid="button-continue-with-google">
        <svg className="continue-with-google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        <span className="continue-with-google-label">{CONTINUE_WITH_GOOGLE_LABEL}</span>
        <span className="continue-with-google-icon" aria-hidden="true" />
      </a>
    </>
  );
}
