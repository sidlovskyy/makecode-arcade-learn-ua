interface StorageNoticeProps {
  storageAvailable: boolean;
}

export function StorageNotice({ storageAvailable }: StorageNoticeProps) {
  if (storageAvailable) {
    return null;
  }

  return (
    <aside
      className="storage-notice"
      role="status"
      aria-live="polite"
      aria-labelledby="storage-notice-title"
    >
      <div className="page-shell storage-notice__inner">
        <span className="storage-notice__icon" aria-hidden="true">!</span>
        <div>
          <strong className="storage-notice__title" id="storage-notice-title">
            Прогрес не зберігається
          </strong>
          <p>
            Уроки працюють як завжди, але після закриття сторінки прогрес зникне.
          </p>
        </div>
      </div>
    </aside>
  );
}
