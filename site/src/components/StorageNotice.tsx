interface StorageNoticeProps {
  storageAvailable: boolean;
  recoveryFailed: boolean;
}

export function StorageNotice({
  storageAvailable,
  recoveryFailed,
}: StorageNoticeProps) {
  if (storageAvailable && !recoveryFailed) {
    return null;
  }

  const showRecoveryNotice = recoveryFailed && storageAvailable;
  const title = showRecoveryNotice
    ? 'Збережений прогрес не відновлено'
    : 'Прогрес не зберігається';
  const message = showRecoveryNotice
    ? 'Курс починається спочатку. Новий прогрес зберігатиметься у цьому браузері.'
    : 'Уроки працюють як завжди, але після закриття сторінки прогрес зникне.';

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
            {title}
          </strong>
          <p>{message}</p>
        </div>
      </div>
    </aside>
  );
}
