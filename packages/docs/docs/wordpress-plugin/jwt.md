
# JWT Authentication

The Findkit Search Endpoint can be configured to require JWT token authentication.
This can be used to implement private search for non-public sites.

## Setup

The WordPress plugin automatically generates a private / public key pair to the
`findkit_pubkey` and `findkit_privkey` options. Add the public key to the
`findkit.toml` file and set the endpoint to private:

```toml
[search-endpoint]
private = true
public_key = """
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAvbvzQ+AsMP0UnNpXmk4P
39O3M6SHkcqtP3e6TR/S1LI6cVFF/QdentwYYIABUwbEzxJuYWP6v/BLittCAWSg
YsrbImrGHokgO/ItOU/90DrBL+sL6eeMTfECe9guM5l3JrhE70z9dCuQn6GYp8CL
VAJWdLKCgmReTvEVQTwFObLpWh4YniXuWnYkw9MPxADLXkJU8MjDlwcIumQMaesP
POBVjVuPhtQ+i5V6G2BegemXl8ep6qQ2xt8spNRoAKwt6Nekt5+GWz65Q9juTGdD
6HkR15ij6sSZoOjjSWuiR0CDOhmjDXGCLtqQuLivFq6oGNgP7BqXtoR6hNwSXLSj
eFhoszDoQZjRoL7oJ/dE60wxuB8FG5duam+AXx/3IJl93sAeFWFzLPpXYmdXQVG7
2kADsYCcNgdN2RMuKGjg4Qmu/RWKzzFfI7GbNS6K47Ow0VjmSN1pb3UitTkROjAj
tPsFXX8vhV1AG9w327Wl/R4d45nd9m/dEaUPpej32caqHtWjQsVT/Sry/ZXhxzaD
4OO7YhKjEbvvHMkgTzihKAKFDIhR+revbgjAPPuwKxseiTrAeKIXDHAW4FVzUq1r
2c+CmzKcwnTle2ydkpCZhGENvqNEgRiGoj5BC5r0gYImsSQyB3B2obvOqtsXOwjn
TtZof/qoIldypZCe7BA5ETECAwEAAQ==
-----END PUBLIC KEY-----
"""
```

You can get the public key value with the wp cli for example.

```
wp option get findkit_pubkey
```

and deploy the change.

Put the findkit project id to `findkit_project_id` and set `findkit_enable_jwt`
to a truthy value to enable JWT token generation which will be automatically
picked by the `@findkit/ui` library.

```
wp option set findkit_project_id 'plnGp6Rv0'
wp option set findkit_enable_jwt 1
```


By default this plugin allows only users logged in to use the search endpoint but it can be modified using the [`findkit_allow_jwt`](/wordpress-plugin/#findkit_allow_jwt) filter:

<!-- prettier-ignore -->
```php
add_filter('findkit_allow_jwt', function ($allow) {
    return current_user_can('edit_posts');
}, 10, 1);
```
