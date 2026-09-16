#[test]
fn close_requests_are_not_intercepted() {
  let app_source = include_str!("../src/lib.rs");

  assert!(
    !app_source.contains("prevent_close"),
    "the window close handler must allow a close request to destroy the window"
  );
  assert!(
    !app_source.contains("prevent_exit"),
    "the app exit handler must allow the runtime to terminate after the last window closes"
  );
}
