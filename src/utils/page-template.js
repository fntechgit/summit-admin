import moment from "moment-timezone";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  MILLISECONDS_IN_SECOND,
  PAGE_MODULES_DOWNLOAD,
  PAGE_MODULES_MEDIA_TYPES,
  PAGES_MODULE_KINDS
} from "./constants";

export const denormalizePageModules = (modules = [], timeZone = null) =>
  modules.map((module) => {
    const tmpModule = {
      ...module,
      ...(module.upload_deadline
        ? {
            upload_deadline: timeZone
              ? epochToMomentTimeZone(module.upload_deadline, timeZone)
              : moment(module.upload_deadline * MILLISECONDS_IN_SECOND)
          }
        : {})
    };

    if (module.kind === PAGES_MODULE_KINDS.DOCUMENT) {
      if (module.file) {
        tmpModule.file = [
          {
            ...module.file,
            file_path: module.file.storage_key,
            public_url: module.file.file_url
          }
        ];
        tmpModule.type = PAGE_MODULES_DOWNLOAD.FILE;
      } else {
        tmpModule.type = PAGE_MODULES_DOWNLOAD.URL;
      }
    }
    return tmpModule;
  });

export const normalizePageTemplateModules = (modules = [], timeZone = null) =>
  modules.map((module) => {
    const normalizedModule = { ...module };

    if (module.kind === PAGES_MODULE_KINDS.MEDIA) {
      if (module.upload_deadline) {
        normalizedModule.upload_deadline = timeZone
          ? moment.tz(module.upload_deadline, timeZone).unix()
          : moment.utc(module.upload_deadline).unix();
      }

      if (module.file_type_id) {
        normalizedModule.file_type_id =
          module.file_type_id?.value || module.file_type_id;
      }

      if (module.type === PAGE_MODULES_MEDIA_TYPES.INPUT) {
        delete normalizedModule.file_type_id;
        delete normalizedModule.max_file_size;
      }
    }

    if (module.kind === PAGES_MODULE_KINDS.DOCUMENT) {
      if (module.type === PAGE_MODULES_DOWNLOAD.FILE) {
        normalizedModule.file = module.file?.[0] || null;
        delete normalizedModule.external_url;
      } else {
        delete normalizedModule.file;
        delete normalizedModule.file_id;
      }
    }

    delete normalizedModule._tempId;

    return normalizedModule;
  });
