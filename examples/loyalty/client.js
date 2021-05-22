/**
 * Отображает и создает новых клиентов
 * **/
export default class OrderView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isReset: false,
            tuvisApiToken: Poster.settings.extras["tuvisApiToken"],
            notice: '',
            stage: 1,
        };
    }

    updateInput = (e) => {
        let { id, value } = e.target;
        this.setState({ [id]: value });
    };

    resetInput = () => {
        this.setState({ tuvisApiToken: '' });
    };

    updateToken = (evt) => {
        const { language, engVersionSyntax, setReloadNecessity } = this.props;
        let promiseJson;

        evt.preventDefault();
        this.setState({ stage: -1, notice: '' });
        
        const requestBody = { 
            "extras": {
                "tuvisApiToken": evt.target['tuvisApiToken'].value,
            }
        }

        if (requestBody.extras.tuvisApiToken.trim() === "" || requestBody.extras.tuvisApiToken.length > 40) {
            this.setState({ stage: 1, notice: language === engVersionSyntax ? 'Wrong access key' : 'Неверный ключ доступа' });
            return
        }

        let request = fetch("https://integrations.tuvis.world/poster/tuvis-token-api/set", {
            headers: {
                'Content-Type': 'application/json',
                'X-Poster-Token': Poster.settings.extras["posterAppToken"]
            },
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        request
            .then(promise => {
                promiseJson = promise.json();

                promiseJson
                    .then(data => {
                        if (data.response === true) {
                            this.resetInput();
                            this.setState({ stage: 2 });
                            setReloadNecessity(); // нужно поменять флаг внутри главного состояния, чтобы бонусной системой нельзя было пользоваться, после смены ключа доступа.
                        } else {
                            this.setState({ stage: 1, notice: language === engVersionSyntax ? 'Authorization failed' : 'Ошибка авторизации' });
                        }
                    })
                    .catch(err => {
                        this.setState({ stage: 1 });
                    });
            })
            .catch(err => {
                console.log(err);
                this.setState({ stage: 1, notice: language === engVersionSyntax ? 'Authorization failed' : 'Ошибка авторизации' });
            });
    };

    isResetToTrue = () => {
        this.setState({ isReset: true });
    }

    isResetToFalse = () => {
        this.setState({ isReset: false });
    }

    render() {
        let { tuvisApiToken, stage, notice, isReset } = this.state;
        let { language, engVersionSyntax, isActive, toggleActivity } = this.props;

        let token = Poster.settings.extras["tuvisApiToken"].trim();

        // Отображаем элементы в зависимости от того, какие данные имеем.
        if (token.trim() !== "" && isReset === false) {
            return (
                <div>
                    {/** using hidden input for IOS 9 input focus and onChange fix **/}
                    <input type="hidden"/>

                    <div className="row">
                        <div className="col-xs-12">
                            <div className="input-group-lg">
                                <div style={{textAlign: 'center', color: isActive ? 'black': 'grey'}}>
                                    <p>{language === engVersionSyntax && isActive ? 'Application is active' : language === engVersionSyntax && !isActive ? 'Application is inactive' : language !== engVersionSyntax && isActive ? 'Приложение активно' : language !== engVersionSyntax && !isActive ? 'Приложение не активно' : 'Status unknown'}</p> 
                                    <p>{language === engVersionSyntax ? 'Click the button to change' : 'Нажмите на кнопку, чтобы изменить'}</p>                                  
                                    <button style={{outline: "none", marginTop: "20px"}} className={isActive ? "btn btn-lg btn-success" : "btn btn-lg btn-danger"} onClick={toggleActivity}>TuviS</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="footer">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="btn btn-lg btn-primary" type="submit" onClick={Poster.interface.closePopup}>{language === engVersionSyntax ? 'Close' : 'Закрыть'}</button>
                                <button className="btn btn-lg btn-info" style={{marginRight: "20px"}} type="button" onClick={this.isResetToTrue}>{language === engVersionSyntax ? 'Set access key' : 'Ввести ключ доступа'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else if (stage === -1) {
            return (
                <div style={{textAlign: 'center', color: 'darkblue'}}>
                    <h2>{language === engVersionSyntax ? 'Loading...' : 'Загрузка...'}</h2>
                </div>
            );
        } else if (stage === 1) {
            return (
                <form onSubmit={this.updateToken}>
                    {/** using hidden input for IOS 9 input focus and onChange fix **/}
                    <input type="hidden"/>

                    <div className="row">
                        <div className="col-xs-12">
                            <div className="input-group-lg">
                                <input
                                    className="form-control" style={{marginBottom: '1rem'}} type="text" placeholder={language === engVersionSyntax ? 'Enter an access key' : "Введите ключ доступа"}
                                    id="tuvisApiToken" onChange={this.updateInput} value={tuvisApiToken}
                                />
                                <p style={{color: 'orangered', marginTop: 10}}>{notice}</p>
                                
                                <button className="btn btn-lg btn-warning col-xs-12" type="submit">{language === engVersionSyntax ? 'Submit' : 'Подтвердить'}</button>
                            </div>
                        </div>
                    </div>

                    <div className="footer">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="btn btn-lg btn-danger" onClick={this.isResetToFalse} disabled={token.trim() == ""} type="button">{language === engVersionSyntax ? 'Back' : 'Назад'}</button>
                            </div>
                        </div>
                    </div>
                </form>
            );
        } else if (stage == 2) {
            return (
                <div style={{textAlign: 'center', color: 'darkgreen'}}>
                    <h2>{language === engVersionSyntax ? 'Request successful. Application reload is required.' : 'Операция успешна. Требуется перезагрузить приложение.'}</h2>
                </div>
            );
        } else {
            Poster.interface.closePopup();
            return null
        }
    }
}
