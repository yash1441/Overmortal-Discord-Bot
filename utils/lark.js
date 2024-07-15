const axios = require("axios");

async function authorize(
	id = process.env.FEISHU_ID,
	secret = process.env.FEISHU_SECRET
) {
	const options = {
		method: "POST",
		url: "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal",
		headers: {
			"Content-Type": "application/json",
		},
		data: {
			app_id: id,
			app_secret: secret,
		},
	};

	const response = await axios(options).catch((error) =>
		console.error(error)
	);

	if (response.status === 200) {
		return response.data.tenant_access_token;
	} else {
		console.error(response.data);
		return false;
	}
}

async function listRecords(
	app_token,
	table_id,
	parameters = null,
	id = process.env.FEISHU_ID,
	secret = process.env.FEISHU_SECRET,
	log = false
) {
	const tenantAccessToken = await authorize(id, secret);

	if (!tenantAccessToken) return false;

	const options = {
		method: "GET",
		url:
			"https://open.larksuite.com/open-apis/bitable/v1/apps/" +
			app_token +
			"/tables/" +
			table_id +
			"/records",
		headers: {
			Authorization: "Bearer " + tenantAccessToken,
			"Content-Type": "application/json",
		},
	};

	if (parameters) {
		options.params = parameters;
	}

	const response = await axios(options).catch((error) =>
		console.error(error)
	);

	if (log) console.log(response.data);

	if (response && response.data.code === 0) {
		return response.data.data;
	} else {
		return false;
	}
}

async function createRecord(
	app_token,
	table_id,
	body,
	parameters = null,
	id = process.env.FEISHU_ID,
	secret = process.env.FEISHU_SECRET
) {
	const tenantAccessToken = await authorize(id, secret);

	if (!tenantAccessToken) return false;

	const options = {
		method: "POST",
		url:
			"https://open.larksuite.com/open-apis/bitable/v1/apps/" +
			app_token +
			"/tables/" +
			table_id +
			"/records",
		headers: {
			Authorization: "Bearer " + tenantAccessToken,
			"Content-Type": "application/json",
		},
		data: body,
	};

	if (parameters) {
		options.params = parameters;
	}

	const response = await axios(options).catch((error) =>
		console.error(error)
	);

	if (response && response.data.code === 0) {
		return response.data.data;
	} else {
		console.log(response.data);
		return false;
	}
}

async function updateRecord(
	app_token,
	table_id,
	record_id,
	body,
	parameters = null,
	id = process.env.FEISHU_ID,
	secret = process.env.FEISHU_SECRET
) {
	const tenantAccessToken = await authorize(id, secret);

	if (!tenantAccessToken) return false;

	const options = {
		method: "PUT",
		url:
			"https://open.larksuite.com/open-apis/bitable/v1/apps/" +
			app_token +
			"/tables/" +
			table_id +
			"/records/" +
			record_id,
		headers: {
			Authorization: "Bearer " + tenantAccessToken,
			"Content-Type": "application/json",
		},
		data: body,
	};

	if (parameters) {
		options.params = parameters;
	}

	const response = await axios(options).catch((error) =>
		console.error(error)
	);

	if (response && response.data.code === 0) {
		return response.data.data;
	} else {
		return false;
	}
}

async function findOrCreate(
	app_token,
	table_id,
	find_parameters = null,
    body,
    create_parameters = null,
	id = process.env.FEISHU_ID,
	secret = process.env.FEISHU_SECRET
) {
    const result = {
        error : false
    };
	const tenantAccessToken = await authorize(id, secret);

	if (!tenantAccessToken) {
        result.error = true;
        return result;
    }

	const options = {
		method: "GET",
		url:
			"https://open.larksuite.com/open-apis/bitable/v1/apps/" +
			app_token +
			"/tables/" +
			table_id +
			"/records",
		headers: {
			Authorization: "Bearer " + tenantAccessToken,
			"Content-Type": "application/json",
		},
	};

	if (find_parameters) {
		options.params = find_parameters;
	}

	const response = await axios(options).catch((error) =>
		console.error(error)
	);

	if (!response || response.data?.code != 0) {
        result.error = true;
        return result;
    }

    if (response.data.data.total === 0) {
        result.created = true;
        result.response = await createRecord(
            app_token,
            table_id,
            body,
            create_parameters
        );
        return result;
    } else {
        result.created = false;
        result.response = response.data.data.items;
        return result;
    }
}

module.exports = { listRecords, createRecord, updateRecord, findOrCreate };
